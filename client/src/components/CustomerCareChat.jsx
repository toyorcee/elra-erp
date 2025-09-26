import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HiChatBubbleLeftRight,
  HiXMark,
  HiPaperAirplane,
  HiTicket,
  HiExclamationTriangle,
  HiClock,
  HiCheckCircle,
} from "react-icons/hi2";
import { complaintAPI } from "../services/customerCareAPI";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const CustomerCareChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [chatSession, setChatSession] = useState([]);
  const [isComplaintMode, setIsComplaintMode] = useState(false);
  const [finalComplaintMessage, setFinalComplaintMessage] = useState("");
  const [userHistory, setUserHistory] = useState(null);
  const [showHistoryOptions, setShowHistoryOptions] = useState(false);
  const [conversationState, setConversationState] = useState("idle");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && !userHistory) {
      const prefetchedComplaintId = sessionStorage.getItem(
        "prefetchedComplaintId"
      );
      if (!prefetchedComplaintId) {
        checkUserHistory();
      } else {
        return;
      }
    }
  }, [isOpen, user]);

  const checkUserHistory = async () => {
    const prefetchedComplaintId = sessionStorage.getItem(
      "prefetchedComplaintId"
    );
    if (prefetchedComplaintId) {
      return; 
    }

    try {
      const complaintsResponse = await complaintAPI.getComplaints({
        submittedByMe: true,
        limit: 5,
        sortBy: "submittedAt",
        sortOrder: "desc",
      });

      if (
        complaintsResponse.success &&
        complaintsResponse.data.complaints.length > 0
      ) {
        const recentComplaints = complaintsResponse.data.complaints;
        const activeComplaints = recentComplaints.filter(
          (c) => c.status === "pending" || c.status === "in_progress"
        );
        const recentComplaints_24h = recentComplaints.filter((c) => {
          const complaintDate = new Date(c.submittedAt);
          const now = new Date();
          const diffHours = (now - complaintDate) / (1000 * 60 * 60);
          return diffHours <= 24;
        });

        setUserHistory({
          recentComplaints: recentComplaints_24h,
          activeComplaints,
          hasRecentActivity: recentComplaints_24h.length > 0,
          hasActiveComplaints: activeComplaints.length > 0,
        });

        showSmartGreeting(recentComplaints_24h, activeComplaints);
      } else {
        showDefaultGreeting();
      }
    } catch (error) {
      console.error("Error checking user history:", error);
      showDefaultGreeting();
    }
  };

  const showSmartGreeting = (recentComplaints, activeComplaints) => {
    if (activeComplaints.length > 0) {
      const activeComplaint = activeComplaints[0];
      const smartMessage = {
        id: Date.now(),
        type: "bot",
        message: `Welcome back! I see you have an active complaint (#${activeComplaint.complaintNumber}) about "${activeComplaint.title}". Would you like to continue discussing this issue or start a new complaint?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([smartMessage]);
      setShowHistoryOptions(true);
      setConversationState("waiting_for_choice");
    } else if (recentComplaints.length > 0) {
      const recentComplaint = recentComplaints[0];
      const smartMessage = {
        id: Date.now(),
        type: "bot",
        message: `Hi! I see you submitted a complaint recently (#${recentComplaint.complaintNumber}) about "${recentComplaint.title}". Is this related to that issue or do you have a new concern?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([smartMessage]);
      setShowHistoryOptions(true);
      setConversationState("waiting_for_choice");
    } else {
      showDefaultGreeting();
    }
  };

  const showDefaultGreeting = () => {
    const defaultMessage = {
      id: Date.now(),
      type: "bot",
      message:
        "Hi! I'm here to help with your concerns. How can I assist you today?",
      timestamp: new Date().toISOString(),
    };
    setMessages([defaultMessage]);
    setShowHistoryOptions(false);
  };

  const resetChat = () => {
    const prefetchedComplaintId = sessionStorage.getItem(
      "prefetchedComplaintId"
    );
    sessionStorage.removeItem("prefetchedComplaintId");

    if (!prefetchedComplaintId) {
      setMessages([
        {
          id: 1,
          type: "bot",
          message:
            "Hi! I'm here to help with your concerns. How can I assist you today?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setMessages([]);
    }
    setNewMessage("");
    setIsTyping(false);
    setIsSubmittingComplaint(false);
    setChatSession([]);
    setIsComplaintMode(false);
    setFinalComplaintMessage("");
    setUserHistory(null);
    setShowHistoryOptions(false);
    setConversationState("idle");
  };

  useEffect(() => {
    const prefetchedComplaintId = sessionStorage.getItem(
      "prefetchedComplaintId"
    );

    if (prefetchedComplaintId) {
      fetchComplaintDetails(prefetchedComplaintId);
      sessionStorage.removeItem("prefetchedComplaintId");
    }
  }, []);

  const fetchComplaintDetails = async (complaintId) => {
    setIsTyping(true);

    try {
      const response = await complaintAPI.getComplaintById(complaintId);

      if (response.success) {
        const complaint = response.data;

        const prefetchedMessage = {
          id: Date.now(),
          type: "bot",
          message: `I see you want to continue discussing your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: ${complaint.status}. How can I help you with this issue?`,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, prefetchedMessage]);
      } else {
        console.error("❌ API response not successful:", response);
        const fallbackMessage = {
          id: Date.now(),
          type: "bot",
          message:
            "I see you want to continue discussing a complaint. How can I help you with this issue?",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error("❌ Error fetching complaint details:", error);
      const fallbackMessage = {
        id: Date.now(),
        type: "bot",
        message:
          "I see you want to continue discussing a complaint. How can I help you with this issue?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const isSpamOrAbuse = (message) => {
    const lowerMessage = message.toLowerCase();

    const spamKeywords = [
      "spam",
      "junk",
      "waste",
      "rubbish",
      "garbage",
      "trash",
      "nonsense",
      "bullshit",
      "crap",
      "shit",
      "fuck",
      "fucking",
      "stupid",
      "idiot",
      "dumb",
      "useless",
      "pointless",
      "waste of time",
      "time waste",
      "boring",
      "annoying",
      "hate",
      "dislike",
      "suck",
      "sucks",
      "terrible",
      "awful",
      "worst",
      "bad",
      "horrible",
      "disgusting",
      "gross",
      "kill",
      "die",
      "death",
      "murder",
      "suicide",
      "harm",
      "threat",
      "threaten",
      "violence",
      "fight",
      "attack",
      "curse",
      "cursed",
      "damn",
      "hell",
      "devil",
      "evil",
      "sex",
      "sexual",
      "porn",
      "nude",
      "naked",
      "dick",
      "pussy",
      "pay me",
      "scam",
      "fraud",
      "fake",
      "lie",
      "lying",
      "liar",
      "test",
      "testing",
      "try",
      "trying",
      "experiment",
      "repeat",
      "again",
      "copy",
      "paste",
    ];

    const abuseKeywords = [
      "fool",
      "mumu",
      "olodo",
      "idiot",
      "stupid",
      "dumb",
      "bastard",
      "son of bitch",
      "motherfucker",
      "fucker",
      "asshole",
      "dickhead",
      "prick",
      "cunt",
      "bitch",
      "fuck you",
      "fuck u",
      "fuck off",
      "go to hell",
      "damn you",
      "kill yourself",
      "die",
      "drop dead",
      "shut up",
      "shut your mouth",
      "keep quiet",
      "be quiet",
      "nonsense",
      "rubbish",
      "garbage",
      "trash",
      "useless",
      "worthless",
      "pathetic",
      "disgusting",
      "hate you",
      "dislike you",
      "annoying",
      "irritating",
      "frustrating",
      "angry",
      "mad",
      "crazy",
      "insane",
      "threat",
      "threaten",
      "violence",
      "fight",
      "attack",
      "curse",
      "cursed",
      "damn",
      "hell",
      "devil",
      "evil",
    ];

    const hasSpam = spamKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    const hasAbuse = abuseKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    const words = lowerMessage.split(" ");
    const wordCount = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    const hasRepetition = Object.values(wordCount).some((count) => count > 3);

    const hasExcessiveLength = message.length > 500;

    const hasAllCaps = message === message.toUpperCase() && message.length > 10;

    return (
      hasSpam || hasAbuse || hasRepetition || hasExcessiveLength || hasAllCaps
    );
  };

  const handleFeedbackCheckForRecentComplaint = async () => {
    try {
      setIsTyping(true);

      const response = await complaintAPI.getComplaints({
        submittedByMe: true,
        limit: 1,
        sortBy: "submittedAt",
        sortOrder: "desc",
      });

      if (response.success && response.data.complaints.length > 0) {
        const latestComplaint = response.data.complaints[0];

        await handleFeedbackCheck(latestComplaint._id);
      } else {
        setTimeout(() => {
          const botResponse = {
            id: Date.now(),
            type: "bot",
            message:
              "I don't see any recent complaints from you. Would you like to submit a new complaint?",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
        }, 1500);
      }
    } catch (error) {
      console.error(
        "❌ [CUSTOMER CARE CHAT] Error fetching recent complaints:",
        error
      );
      setTimeout(() => {
        const botResponse = {
          id: Date.now(),
          type: "bot",
          message:
            "I'm having trouble checking your complaint status right now. Please try again or contact support directly.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleFeedbackCheck = async (complaintId) => {
    try {
      setIsTyping(true);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await complaintAPI.getComplaintById(complaintId);

      if (response.success) {
        const complaint = response.data;
        await complaintAPI.sendReminderNotification(complaintId);

        let botMessage = "";

        switch (complaint.status) {
          case "pending":
            botMessage = `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: 🟡 **PENDING** - I've sent a reminder to the Customer Care team. They should respond within 24-48 hours. Are there any other issues I can help you with?`;
            break;
          case "in_progress":
            botMessage = `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: 🔵 **IN PROGRESS** - I've sent a reminder to the assigned team member. They should provide an update soon. Are there any other issues I can help you with?`;
            break;
          case "resolved":
            botMessage = `Great news! Your complaint "${complaint.title}" (${complaint.complaintNumber}) has been 🟢 **RESOLVED**! If you haven't received the resolution details, I'll send a reminder to the team to follow up with you directly. Are there any other issues I can help you with?`;
            break;
          case "closed":
            botMessage = `Your complaint "${complaint.title}" (${complaint.complaintNumber}) has been ⚫ **CLOSED**. If you have any questions about the resolution, I can help you get in touch with the Customer Care team. Are there any other issues I can help you with?`;
            break;
          default:
            botMessage = `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). I've sent a reminder notification to the Customer Care team about your concern. Are there any other issues I can help you with?`;
        }

        const statusResponse = {
          id: Date.now(),
          type: "bot",
          message: botMessage,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, statusResponse]);
        setIsTyping(false);
      } else {
        const errorResponse = {
          id: Date.now(),
          type: "bot",
          message:
            "I'm having trouble checking your complaint status right now, but I've sent a reminder notification to the Customer Care team about your concern. They should get back to you soon.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorResponse]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error(
        "❌ [CUSTOMER CARE CHAT] Error checking complaint status:",
        error
      );
      const errorResponse = {
        id: Date.now(),
        type: "bot",
        message:
          "I'm having trouble checking your complaint status right now, but I've sent a reminder notification to the Customer Care team about your concern. They should get back to you soon.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    if (isSpamOrAbuse(newMessage)) {
      const abuseMessage = {
        id: Date.now(),
        type: "bot",
        message:
          "⚠️ Your message contains inappropriate content. Please keep your communication professional and related to work issues only. If you have a legitimate complaint, please describe it properly.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, abuseMessage]);
      setNewMessage("");
      return;
    }

    if (
      messages.length === 0 ||
      (messages.length === 1 && messages[0].type === "bot")
    ) {
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatSession((prev) => [...prev, userMessage]);

    const messageText = newMessage;
    setNewMessage("");
    setIsTyping(true);

    // 1. FIRST PRIORITY: Check for submit command in complaint mode
    if (messageText.toLowerCase().includes("submit") && isComplaintMode) {
      await handleSubmitComplaintFromSession();
      return;
    }

    // 2. SECOND PRIORITY: Check for feedback-related keywords
    const feedbackKeywords = [
      "feedback",
      "response",
      "reply",
      "answer",
      "update",
      "status",
      "progress",
      "heard",
      "contacted",
      "reached",
      "called",
      "emailed",
      "messaged",
      "notified",
      "assigned",
      "assigned to",
      "handled",
      "processed",
      "reviewed",
      "looked at",
      "haven't",
      "have not",
      "didn't",
      "did not",
      "no response",
      "no feedback",
      "no update",
      "no answer",
      "no reply",
      "silence",
      "ignored",
      "forgotten",
    ];

    const isFeedbackRelated = feedbackKeywords.some((keyword) =>
      messageText.toLowerCase().includes(keyword)
    );

    if (isFeedbackRelated) {
      const prefetchedComplaintId = sessionStorage.getItem(
        "prefetchedComplaintId"
      );

      if (prefetchedComplaintId) {
        handleFeedbackCheck(prefetchedComplaintId);
        return;
      } else {
        handleFeedbackCheckForRecentComplaint();
        return;
      }
    }

    // 2.5. Check for thank you keywords
    const thankYouKeywords = [
      "thank you",
      "thanks",
      "thank u",
      "tanks",
      "tnx",
      "thx",
      "appreciate",
      "grateful",
      "bless",
      "blessed",
      "appreciation",
      "well done",
      "good job",
      "nice work",
      "excellent",
      "great help",
      "helpful",
      "useful",
      "amazing",
      "wonderful",
      "fantastic",
    ];

    const isThankYou = thankYouKeywords.some((keyword) =>
      messageText.toLowerCase().includes(keyword)
    );

    if (isThankYou) {
      setTimeout(() => {
        const thankYouResponse = {
          id: Date.now(),
          type: "bot",
          message:
            "You're very welcome! 😊 I'm here to help with any work-related issues or complaints. Is there anything else I can assist you with?",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, thankYouResponse]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // 3. THIRD PRIORITY: Handle conversation state choices
    if (conversationState === "waiting_for_choice") {
      if (
        messageText.toLowerCase().includes("continue") ||
        messageText.toLowerCase().includes("yes") ||
        messageText.toLowerCase().includes("related") ||
        messageText.toLowerCase().includes("na") ||
        messageText.toLowerCase().includes("abi") ||
        messageText.toLowerCase().includes("sha") ||
        messageText.toLowerCase().includes("ehn") ||
        messageText.toLowerCase().includes("okay") ||
        messageText.toLowerCase().includes("sure") ||
        messageText.toLowerCase().includes("correct") ||
        messageText.toLowerCase().includes("true") ||
        messageText.toLowerCase().includes("that one") ||
        messageText.toLowerCase().includes("same thing") ||
        messageText.toLowerCase().includes("same problem") ||
        messageText.toLowerCase().includes("that issue") ||
        messageText.toLowerCase().includes("that complaint")
      ) {
        setConversationState("complaint_mode");
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: "bot",
            message:
              "Perfect! I'll help you continue with your existing complaint. What would you like to know or discuss about it?",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
        }, 1500);
        return;
      }

      // User wants to start new complaint
      if (
        messageText.toLowerCase().includes("new") ||
        messageText.toLowerCase().includes("different") ||
        messageText.toLowerCase().includes("another") ||
        messageText.toLowerCase().includes("separate") ||
        messageText.toLowerCase().includes("no") ||
        messageText.toLowerCase().includes("never") ||
        messageText.toLowerCase().includes("not") ||
        messageText.toLowerCase().includes("nothing") ||
        messageText.toLowerCase().includes("no be") ||
        messageText.toLowerCase().includes("no o") ||
        messageText.toLowerCase().includes("abi no") ||
        messageText.toLowerCase().includes("e no be") ||
        messageText.toLowerCase().includes("different thing") ||
        messageText.toLowerCase().includes("another thing") ||
        messageText.toLowerCase().includes("new thing") ||
        messageText.toLowerCase().includes("fresh") ||
        messageText.toLowerCase().includes("another complaint") ||
        messageText.toLowerCase().includes("different complaint") ||
        messageText.toLowerCase().includes("new complaint") ||
        messageText.toLowerCase().includes("separate issue") ||
        messageText.toLowerCase().includes("another issue")
      ) {
        setConversationState("new_complaint");
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: "bot",
            message:
              "Great! I'll help you submit a new complaint. Please tell me what issue you'd like to report.",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
        }, 1500);
        return;
      }
    }

    // 4. FOURTH PRIORITY: Check for general complaint keywords
    const complaintKeywords = [
      "complaint",
      "issue",
      "problem",
      "concern",
      "help",
      "support",
    ];
    const isComplaint = complaintKeywords.some((keyword) =>
      messageText.toLowerCase().includes(keyword)
    );

    if (isComplaint) {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "I understand you have a concern. Would you like me to help you submit a formal complaint? This will ensure it gets tracked and resolved properly.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    // 5. FIFTH PRIORITY: Handle yes/no responses
    if (
      messageText.toLowerCase().includes("yes") ||
      messageText.toLowerCase().includes("yeah") ||
      messageText.toLowerCase().includes("ya") ||
      messageText.toLowerCase().includes("sure") ||
      messageText.toLowerCase().includes("ok") ||
      messageText.toLowerCase().includes("okay") ||
      messageText.toLowerCase().includes("yep") ||
      messageText.toLowerCase().includes("yup") ||
      messageText.toLowerCase().includes("na") ||
      messageText.toLowerCase().includes("abi") ||
      messageText.toLowerCase().includes("sha") ||
      messageText.toLowerCase().includes("ehn") ||
      messageText.toLowerCase().includes("correct") ||
      messageText.toLowerCase().includes("true") ||
      messageText.toLowerCase().includes("that one") ||
      messageText.toLowerCase().includes("go ahead") ||
      messageText.toLowerCase().includes("make we do am") ||
      messageText.toLowerCase().includes("let's do it") ||
      messageText.toLowerCase().includes("submit am")
    ) {
      setTimeout(() => {
        setIsComplaintMode(true);
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Perfect! Please tell me more details about your complaint. What exactly is the issue you're experiencing?",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    if (
      messageText.toLowerCase().includes("no") ||
      messageText.toLowerCase().includes("nope") ||
      messageText.toLowerCase().includes("hell no") ||
      messageText.toLowerCase().includes("not really") ||
      messageText.toLowerCase().includes("don't want") ||
      messageText.toLowerCase().includes("dont want") ||
      messageText.toLowerCase().includes("no thanks") ||
      messageText.toLowerCase().includes("no thank you") ||
      messageText.toLowerCase().includes("no be") ||
      messageText.toLowerCase().includes("no o") ||
      messageText.toLowerCase().includes("abi no") ||
      messageText.toLowerCase().includes("e no be") ||
      messageText.toLowerCase().includes("never") ||
      messageText.toLowerCase().includes("not") ||
      messageText.toLowerCase().includes("nothing") ||
      messageText.toLowerCase().includes("no need") ||
      messageText.toLowerCase().includes("no wahala") ||
      messageText.toLowerCase().includes("no problem") ||
      messageText.toLowerCase().includes("e no need") ||
      messageText.toLowerCase().includes("e no necessary")
    ) {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "No problem! If you change your mind or need help with anything else, just let me know. I'm here to assist you with any work-related issues or concerns.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    // 6. DEFAULT: General response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: "bot",
        message:
          "I'm here to help you with work-related issues and complaints. If you have a specific problem or concern, please describe it and I'll help you submit a formal complaint. You can also ask me about the status of existing complaints.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);

    if (
      conversationState === "waiting_for_choice" &&
      (messageText.toLowerCase().includes("continue") ||
        messageText.toLowerCase().includes("yes") ||
        messageText.toLowerCase().includes("related") ||
        messageText.toLowerCase().includes("na") ||
        messageText.toLowerCase().includes("abi") ||
        messageText.toLowerCase().includes("sha") ||
        messageText.toLowerCase().includes("ehn") ||
        messageText.toLowerCase().includes("okay") ||
        messageText.toLowerCase().includes("sure") ||
        messageText.toLowerCase().includes("correct") ||
        messageText.toLowerCase().includes("true") ||
        messageText.toLowerCase().includes("that one") ||
        messageText.toLowerCase().includes("same thing") ||
        messageText.toLowerCase().includes("same problem") ||
        messageText.toLowerCase().includes("that issue") ||
        messageText.toLowerCase().includes("that complaint"))
    ) {
      setConversationState("complaint_mode");
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Perfect! I'll help you continue with your existing complaint. What would you like to know or discuss about it?",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    if (
      conversationState === "waiting_for_choice" &&
      (messageText.toLowerCase().includes("new") ||
        messageText.toLowerCase().includes("different") ||
        messageText.toLowerCase().includes("another") ||
        messageText.toLowerCase().includes("separate") ||
        messageText.toLowerCase().includes("no") ||
        messageText.toLowerCase().includes("never") ||
        messageText.toLowerCase().includes("not") ||
        messageText.toLowerCase().includes("nothing") ||
        messageText.toLowerCase().includes("no be") ||
        messageText.toLowerCase().includes("no o") ||
        messageText.toLowerCase().includes("abi no") ||
        messageText.toLowerCase().includes("e no be") ||
        messageText.toLowerCase().includes("e no be that") ||
        messageText.toLowerCase().includes("different thing") ||
        messageText.toLowerCase().includes("another thing") ||
        messageText.toLowerCase().includes("new thing") ||
        messageText.toLowerCase().includes("fresh") ||
        messageText.toLowerCase().includes("another complaint") ||
        messageText.toLowerCase().includes("different complaint") ||
        messageText.toLowerCase().includes("new complaint") ||
        messageText.toLowerCase().includes("separate issue") ||
        messageText.toLowerCase().includes("another issue"))
    ) {
      setConversationState("new_complaint");
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Great! I'll help you submit a new complaint. Please tell me what issue you'd like to report.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
      return;
    }

    if (isFeedbackRelated) {
      const prefetchedComplaintId = sessionStorage.getItem(
        "prefetchedComplaintId"
      );

      if (prefetchedComplaintId) {
        handleFeedbackCheck(prefetchedComplaintId);
      } else {
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: "bot",
            message:
              "I understand you haven't received feedback yet. Let me check the status of your complaint and see what's happening. I'll also notify the Customer Care team about your concern. Can you tell me more about what you were expecting to hear back about?",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
        }, 1500);
      }
    } else if (isComplaint) {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "I understand you have a concern. Would you like me to help you submit a formal complaint? This will ensure it gets tracked and resolved properly.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } else if (
      messageText.toLowerCase().includes("yes") ||
      messageText.toLowerCase().includes("yeah") ||
      messageText.toLowerCase().includes("ya") ||
      messageText.toLowerCase().includes("sure") ||
      messageText.toLowerCase().includes("ok") ||
      messageText.toLowerCase().includes("okay") ||
      messageText.toLowerCase().includes("yep") ||
      messageText.toLowerCase().includes("yup") ||
      messageText.toLowerCase().includes("na") ||
      messageText.toLowerCase().includes("abi") ||
      messageText.toLowerCase().includes("sha") ||
      messageText.toLowerCase().includes("ehn") ||
      messageText.toLowerCase().includes("correct") ||
      messageText.toLowerCase().includes("true") ||
      messageText.toLowerCase().includes("that one") ||
      messageText.toLowerCase().includes("go ahead") ||
      messageText.toLowerCase().includes("make we do am") ||
      messageText.toLowerCase().includes("let's do it") ||
      messageText.toLowerCase().includes("submit am")
    ) {
      setTimeout(() => {
        setIsComplaintMode(true);
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Great! I'll help you submit your complaint. Please tell me more details about your complaint - what exactly happened and how can we help resolve it?",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } else if (
      messageText.toLowerCase().includes("no") ||
      messageText.toLowerCase().includes("nope") ||
      messageText.toLowerCase().includes("hell no") ||
      messageText.toLowerCase().includes("not really") ||
      messageText.toLowerCase().includes("don't want") ||
      messageText.toLowerCase().includes("dont want") ||
      messageText.toLowerCase().includes("no thanks") ||
      messageText.toLowerCase().includes("no thank you") ||
      messageText.toLowerCase().includes("no be") ||
      messageText.toLowerCase().includes("no o") ||
      messageText.toLowerCase().includes("abi no") ||
      messageText.toLowerCase().includes("e no be") ||
      messageText.toLowerCase().includes("never") ||
      messageText.toLowerCase().includes("not") ||
      messageText.toLowerCase().includes("nothing") ||
      messageText.toLowerCase().includes("no need") ||
      messageText.toLowerCase().includes("no wahala") ||
      messageText.toLowerCase().includes("no problem") ||
      messageText.toLowerCase().includes("e no need") ||
      messageText.toLowerCase().includes("e no necessary")
    ) {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "No problem! I'm still here if you need any help or want to discuss anything else. Feel free to ask me anything!",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } else if (isComplaintMode) {
      setFinalComplaintMessage(messageText);
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Thank you for the details. Would you like me to submit this complaint now? Type 'submit' to send it to our Customer Care team.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } else {
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Thank you for your message. I'm here to help! If you have a specific concern or complaint, please let me know and I can help you submit it formally.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContinueComplaint = (complaint) => {
    sessionStorage.setItem("prefetchedComplaintId", complaint._id);

    const continueMessage = {
      id: Date.now(),
      type: "bot",
      message: `I'll help you continue discussing your complaint #${complaint.complaintNumber} about "${complaint.title}". What would you like to know or discuss?`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, continueMessage]);
    setShowHistoryOptions(false);
  };

  const handleStartNewComplaint = () => {
    sessionStorage.removeItem("prefetchedComplaintId");

    const newComplaintMessage = {
      id: Date.now(),
      type: "bot",
      message:
        "Great! I'll help you submit a new complaint. Please tell me what issue you'd like to report.",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newComplaintMessage]);
    setShowHistoryOptions(false);
  };

  const handleViewHistory = () => {
    setIsOpen(false);
    navigate("/dashboard/modules/customer-care/my-complaints");
  };

  const handleSubmitComplaintFromSession = async () => {
    try {
      setIsSubmittingComplaint(true);

      const title =
        finalComplaintMessage ||
        chatSession.find((msg) => msg.type === "user")?.message ||
        `Customer Care Complaint - ${new Date().toLocaleDateString()}`;

      const sessionText = chatSession
        .map((msg) => `${msg.type}: ${msg.message}`)
        .join("\n");

      const userName =
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : user?.name || "Unknown User";
      const userDepartment = user?.department?.name || "Unknown Department";

      const getImageUrl = (avatarPath) => {
        if (!avatarPath) return "/default-avatar.png";
        if (avatarPath.startsWith("http")) return avatarPath;

        const baseUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        ).replace("/api", "");
        return `${baseUrl}${avatarPath}`;
      };

      const userImage = getImageUrl(user?.avatar);

      const description = `COMPLAINT SUBMITTED BY:
Name: ${userName}
Department: ${userDepartment}
Profile Image: ${userImage}

COMPLAINT DETAILS:
${finalComplaintMessage || "User complaint details from chat session"}

FULL CONVERSATION CONTEXT:
${sessionText}`;

      const complaintData = {
        title,
        description,
        category: "other",
        priority: "medium",
      };

      const response = await complaintAPI.createComplaint(complaintData);

      if (response.success) {
        try {
          const sessionData = {
            complaintId: response.data._id,
            responderId: user._id,
            responderName: userName,
            responderDepartment: userDepartment,
            sessionTranscript: sessionText,
            startTime: new Date(),
            endTime: new Date(),
            status: "completed",
            resolution: "Complaint submitted via chat",
            notes: "User submitted complaint through chat interface",
          };

          await complaintAPI.saveSession(sessionData);
        } catch (sessionError) {
          console.error(
            "❌ [CUSTOMER CARE CHAT] Error saving session:",
            sessionError
          );
        }

        toast.success("Complaint submitted successfully!");

        const successMessage = {
          id: Date.now(),
          type: "bot",
          message: `✅ Complaint submitted successfully! Your complaint number is: ${
            response.data.complaintNumber || "CC-XXXXXX"
          }. You'll receive a confirmation email shortly.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, successMessage]);

        setIsComplaintMode(false);
        setChatSession([]);
      } else {
        toast.error("Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleSubmitComplaint = async (
    title,
    description,
    category = "other",
    priority = "medium"
  ) => {
    try {
      setIsSubmittingComplaint(true);

      const complaintData = {
        title,
        description,
        category,
        priority,
      };

      const response = await complaintAPI.createComplaint(complaintData);

      if (response.success) {
        toast.success("Complaint submitted successfully!");

        const successMessage = {
          id: Date.now(),
          type: "bot",
          message: `Great! I've submitted your complaint "${title}". You'll receive a confirmation email shortly with your complaint number: ${
            response.data.complaintNumber || "CC-XXXXXX"
          }.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } else {
        toast.error("Failed to submit complaint. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const quickActions = [
    {
      icon: HiTicket,
      label: "Submit Complaint",
      action: () => {
        setNewMessage("I would like to submit a complaint about...");
      },
    },
    {
      icon: HiExclamationTriangle,
      label: "Report Issue",
      action: () => {
        setNewMessage("I need to report an issue with...");
      },
    },
    {
      icon: HiClock,
      label: "Check Status",
      action: () => {
        setNewMessage(
          "Can you help me check the status of my previous complaint?"
        );
      },
    },
  ];

  const isCustomerCareUser =
    user?.department?.name === "Customer Service" ||
    user?.department?.name === "Customer Care";

  if (isCustomerCareUser) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        data-chat-button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          resetChat();
          setIsOpen(true);
        }}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <HiChatBubbleLeftRight className="w-6 h-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[75vh] max-h-[650px] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-full">
                      <HiChatBubbleLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Customer Care</h3>
                      <p className="text-sm text-white/80">
                        We're here to help
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <HiXMark className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Smart Actions - Single Section */}
              {showHistoryOptions && userHistory && (
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                  <p className="text-sm text-gray-700 mb-3 font-medium">
                    What would you like to do?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userHistory.hasActiveComplaints && (
                      <button
                        onClick={() =>
                          handleContinueComplaint(
                            userHistory.activeComplaints[0]
                          )
                        }
                        className="flex items-center space-x-3 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <HiClock className="w-5 h-5" />
                        <span>Continue Active Complaint</span>
                      </button>
                    )}
                    <button
                      onClick={handleStartNewComplaint}
                      className="flex items-center space-x-3 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <HiTicket className="w-5 h-5" />
                      <span>Start New Complaint</span>
                    </button>
                    <button
                      onClick={handleViewHistory}
                      className="flex items-center space-x-3 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <HiCheckCircle className="w-5 h-5" />
                      <span>View My Complaints</span>
                    </button>
                    <button
                      onClick={() =>
                        setNewMessage("I need to report an issue with...")
                      }
                      className="flex items-center space-x-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <HiExclamationTriangle className="w-5 h-5" />
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-[var(--elra-primary)] text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 p-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSubmittingComplaint}
                    className="p-3 bg-[var(--elra-primary)] text-white rounded-xl hover:bg-[var(--elra-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingComplaint ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <HiPaperAirplane className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerCareChat;
