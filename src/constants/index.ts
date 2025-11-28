import { ImageIcons } from "@/utils/ImageIcons";
import { router } from "expo-router";

export const quickStartOptions = [
  {
    title: "Craft a Message",
    icon: ImageIcons.CraftMessage,
    knowMore: {
      action: () => router.push({
        pathname: "/(protected)/(tabs)/global-chat",
        params: { autoMessage: "Craft a Message" },
      }),
      title: "Craft a Message",
      description: "Compose personalized messages for your contacts",
      cards: [
        {
          title: "Choose Your Contact",
          description: "Select who you want to reach out to from your network. We'll automatically pull up your past conversations and their context to personalize your message."
        },
        {
          title: "Add Context",
          description: "Tell us what this message is about. Catching up after a conference? Following up on a job referral? The more context you share, the better we can help you craft the right tone"
        },
        {
          title: "Pick Your Message",
          description: "Review 3 personalized message options tailored to your relationship and goal. Choose the one that feels most authentic to you, edit if needed, and send."
        }
      ],
      subText: "Head to the Al Assistant and start using this feature to build stronger relationships!",
      bgColor: ['#3B82F6', '#06B6D4'],
      icon: "message-square"
    }
  },
  {
    title: "Follow-Up",
    icon: ImageIcons.Follow_up,
    knowMore: {
      action: () => router.push({
        pathname: "/(protected)/(tabs)/global-chat",
        params: { autoMessage: "Follow-Up" },
      }),
      title: "Follow-Up",
      description: "Set reminders after meeting or speaking with someone",
      cards: [
        {
          title: "Who did you meet?",
          description: "Select the contact you spoke with. We'll load your past conversations and their context to set up a meaningful follow-up."
        },
        {
          title: "Capture the conversation",
          description: "Tell us what you discussed, when it happened, and any key takeaways. Use voice notes or type it out-whatever's easiest for you."
        },
        {
          title: "Capture the conversation",
          description: "Tell us what you discussed, when it happened, and any key takeaways. Use voice notes or type it out-whatever's easiest for you."
        }
      ],
      subText: "Head to the Al Assistant and start using this feature to build stronger relationships!",
      bgColor: ["#6366F1", "#8B5CF6"],
      icon: "clock"
    }
  },
  {
    title: "Connect Calendar",
    icon: ImageIcons.ConnectCalendar,
    knowMore: {
      action: () => router.push({
        pathname: "/(protected)/(tabs)/global-chat",
        params: { autoMessage: "Connect Calendar" },
      }),
      title: "Connect Calendar",
      description: "Schedule meetings with new contacts for future dates",
      cards: [
        {
          title: "Select a new contact",
          description: "Choose someone from your network you haven't met with yet. This is for scheduling your first meeting together."
        },
        {
          title: "Set meeting details",
          description: "Pick a date, time, and meeting purpose. Add any notes about what you want to discuss or accomplish in this first meeting."
        },
        {
          title: "Send the invite",
          description: "Review and send your calendar invitation. We'll track this connection and help you prepare with context before your meeting."
        }
      ],
      subText: "Head to the Al Assistant and start using this feature to build stronger relationships!",
      bgColor: ["#10B981", "#14B8A6"],
      icon: 'calendar'
    }
  },
  {
    title: "Thank You & Appreciation",
    icon: ImageIcons.ThankYou,
    knowMore: {
      action: () => router.push({
        pathname: "/(protected)/(tabs)/global-chat",
        params: { autoMessage: "Thank You & Appreciation" },
      }),
      title: "Thank You & Gratitude",
      description: "Show appreciation to contacts who've helped you",
      cards: [
        {
          title: "Who helped you?",
          description: "Select the contact you want to thank. We'll pull up your past conversations and their context to make your gratitude specific and meaningful."
        },
        {
          title: "Share why you're grateful",
          description: "Tell us what they did-made an intro, gave advice, supported your project? The more specific you are, the more genuine your message will feel."
        },
        {
          title: "Send your appreciation",
          description: "Review your personalized thank you message. Edit if you'd like, then send it to strengthen your relationship through gratitude."
        }
      ],
      subText: "Head to the Al Assistant and start using this feature to build stronger relationships!",
      bgColor: ["#A855F7", "#EC4899"],
      icon: "heart"
    }
  },
  {
    title: "Networking Playbook",
    icon: ImageIcons.NetworkingPlaybook,
    knowMore: {
      action: () => router.push({
        pathname: "/(protected)/(tabs)/global-chat",
        params: { autoMessage: "Networking Playbook" },
      }),
      title: "Networking Playbooks",
      description: "Explore proven networking techniques",
      cards: [
        {
          title: "Choose your goal",
          description: "Browse playbooks by what you want to improve: nurturing your network, starting conversations, building deeper connections, or other networking skills."
        },
        {
          title: "Learn the technique",
          description: "Read through proven strategies, conversation starters, and actionable tips tailored to your networking goal."
        },
        {
          title: "Put it into practice",
          description: "Apply what you learned in your next interaction. Use Zirkl's other features to implement these techniques with your contacts."
        }
      ],
      subText: "Head to the Al Assistant and start using this feature to build stronger relationships!",
      bgColor: ["#F59E0B", "#F97316"],
      icon: "book-open"
    }
  },
];
