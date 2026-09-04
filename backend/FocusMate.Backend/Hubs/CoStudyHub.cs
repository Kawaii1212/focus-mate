using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace FocusMate.Backend.Hubs;

public class CoStudyMember
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public int MascotPersonaId { get; set; }
    public string Status { get; set; } = "focusing"; // "focusing", "break", "inactive", "missed-checkin"
}

public class PomodoroState
{
    public int TimeLeft { get; set; } = 25 * 60;
    public bool IsActive { get; set; } = false;
    public string Mode { get; set; } = "focus"; // "focus", "break"
}

public class RoomData
{
    public string Name { get; set; } = "Co-Study Room";
    public int MaxMembers { get; set; } = 4;
    public int CheckInIntervalMinutes { get; set; } = 30;
    public int SharedMinutes { get; set; } = 0;
    public ConcurrentDictionary<string, CoStudyMember> Members { get; set; } = new();
    public PomodoroState Pomodoro { get; set; } = new();
}

public class CoStudyHub : Hub
{
    // In-memory store for MVP demo
    private static readonly ConcurrentDictionary<string, RoomData> Rooms = new();
    private static readonly ConcurrentDictionary<string, string> ConnectionToUser = new();
    private static readonly ConcurrentDictionary<string, string> ConnectionToRoom = new();

    public async Task<object> JoinRoom(string roomId, string userId, string name, int personaId, string roomName = "Co-Study Room", int maxMembers = 4, int checkInInterval = 30)
    {
        Console.WriteLine($"[Hub] JoinRoom called: Room={roomId}, User={name}");
        var room = Rooms.GetOrAdd(roomId, _ => new RoomData 
        { 
            Name = roomName, 
            MaxMembers = maxMembers, 
            CheckInIntervalMinutes = checkInInterval 
        });
        
        var newMember = new CoStudyMember
        {
            Id = userId,
            Name = name,
            MascotPersonaId = personaId,
            Status = "focusing"
        };
        
        room.Members[userId] = newMember;
        ConnectionToUser[Context.ConnectionId] = userId;
        ConnectionToRoom[Context.ConnectionId] = roomId;

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

        // Notify others
        await Clients.Group(roomId).SendAsync("MemberJoined", newMember);

        // Return current room state to the joiner
        return new
        {
            members = room.Members,
            pomodoro = room.Pomodoro
        };
    }

    public async Task LeaveRoom(string roomId, string userId)
    {
        if (Rooms.TryGetValue(roomId, out var room))
        {
            room.Members.TryRemove(userId, out _);
            if (room.Members.IsEmpty)
            {
                Rooms.TryRemove(roomId, out _);
            }
        }
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("MemberLeft", userId);
    }

    public async Task UpdateStatus(string roomId, string userId, string status)
    {
        if (Rooms.TryGetValue(roomId, out var room) && room.Members.TryGetValue(userId, out var member))
        {
            member.Status = status;
            await Clients.Group(roomId).SendAsync("MemberStatusUpdated", userId, status);
        }
    }

    public async Task CheckIn(string roomId, string userId)
    {
        // Just broadcast that they are focusing to clear any missed-checkin
        await UpdateStatus(roomId, userId, "focusing");
    }

    public async Task SyncPomodoro(string roomId, PomodoroState state)
    {
        if (Rooms.TryGetValue(roomId, out var room))
        {
            room.Pomodoro = state;
            // Broadcast to everyone else in the room
            await Clients.OthersInGroup(roomId).SendAsync("PomodoroSynced", state);
        }
    }

    public object[] GetActiveRooms()
    {
        Console.WriteLine($"[Hub] GetActiveRooms called, returning {Rooms.Count} rooms.");
        return Rooms.Select(r => new
        {
            id = r.Key,
            name = r.Value.Name,
            maxMembers = r.Value.MaxMembers,
            checkInIntervalMinutes = r.Value.CheckInIntervalMinutes,
            sharedMinutes = r.Value.SharedMinutes,
            members = r.Value.Members
        }).ToArray();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectionToRoom.TryGetValue(Context.ConnectionId, out var roomId) &&
            ConnectionToUser.TryGetValue(Context.ConnectionId, out var userId))
        {
            await LeaveRoom(roomId, userId);
            ConnectionToRoom.TryRemove(Context.ConnectionId, out _);
            ConnectionToUser.TryRemove(Context.ConnectionId, out _);
        }
        await base.OnDisconnectedAsync(exception);
    }
}
