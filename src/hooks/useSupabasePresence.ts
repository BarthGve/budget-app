import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSupabasePresence() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase.channel("global-presence");

    const updateOnlineStatus = () => {
      const userIds = Object.keys(channel.presenceState());
      setOnlineUsers(userIds);
    };

    channel
      .on("presence", { event: "join" }, updateOnlineStatus)
      .on("presence", { event: "leave" }, updateOnlineStatus)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          updateOnlineStatus();
        } else if (status === "CHANNEL_ERROR") {
          console.error("[useSupabasePresence] Channel error:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return onlineUsers;
}
