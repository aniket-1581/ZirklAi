import { ImageIcons } from "@/utils/ImageIcons";
import { router } from "expo-router";

export const quickStartOptions = [
  {
    title: "Networking Playbook",
    icon: ImageIcons.NetworkingPlaybook,
    action: () => router.push({
      pathname: "/(protected)/(tabs)/global-chat",
      params: { autoMessage: "Networking Playbook" },
    }),
  },
  {
    title: "Craft a Message",
    icon: ImageIcons.CraftMessage,
    action: () => router.push({
      pathname: "/(protected)/(tabs)/global-chat",
      params: { autoMessage: "Craft a Message" },
    }),
  },
  {
    title: "Connect Calendar",
    icon: ImageIcons.ConnectCalendar,
    action: () => router.push({
      pathname: "/(protected)/(tabs)/global-chat",
      params: { autoMessage: "Connect Calendar" },
    }),
  },
  {
    title: "Follow-Up",
    icon: ImageIcons.Follow_up,
    action: () => router.push({
      pathname: "/(protected)/(tabs)/global-chat",
      params: { autoMessage: "Follow-Up" },
    }),
  },
  {
    title: "Thank You & Appreciation",
    icon: ImageIcons.ThankYou,
    action: () => router.push({
      pathname: "/(protected)/(tabs)/global-chat",
      params: { autoMessage: "Thank You & Appreciation" },
    }),
  },
];
