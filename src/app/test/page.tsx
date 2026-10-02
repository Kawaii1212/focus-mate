'use client';
import { useChat } from '@ai-sdk/react';
export default function Test() {
  const chat = useChat();
  return <div id="keys">{JSON.stringify(Object.keys(chat))}</div>;
}
