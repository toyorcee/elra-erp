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
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintCategory, setComplaintCategory] = useState("");
  const [complaintPriority, setComplaintPriority] = useState("");
  const [complaintStep, setComplaintStep] = useState("category");
  const [showCategoryButtons, setShowCategoryButtons] = useState(false);
  const [showPriorityButtons, setShowPriorityButtons] = useState(false);
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

  // Add/remove body class when chat is open/closed
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("chat-modal-open");
    } else {
      document.body.classList.remove("chat-modal-open");
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("chat-modal-open");
    };
  }, [isOpen]);

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

    setIsTyping(true);

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
    } finally {
      setIsTyping(false);
    }
  };

  const showSmartGreeting = (recentComplaints, activeComplaints) => {
    if (activeComplaints.length > 0) {
      const activeComplaint = activeComplaints[0];
      sessionStorage.setItem("prefetchedComplaintId", activeComplaint._id);
      const smartMessage = {
        id: Date.now(),
        type: "bot",
        message: `Welcome back! I see you have an active complaint (#${activeComplaint.complaintNumber}) about "${activeComplaint.title}". Say "yes" to check the status, or "no" to submit a new complaint.`,
        timestamp: new Date().toISOString(),
      };
      setMessages([smartMessage]);
      setShowHistoryOptions(true);
      setConversationState("waiting_for_choice");
    } else if (recentComplaints.length > 0) {
      const recentComplaint = recentComplaints[0];
      // Store complaint ID for status check
      sessionStorage.setItem("prefetchedComplaintId", recentComplaint._id);
      const smartMessage = {
        id: Date.now(),
        type: "bot",
        message: `Hi! I see you submitted a complaint recently (#${recentComplaint.complaintNumber}) about "${recentComplaint.title}". Say "yes" to check the status, or "no" to submit a new complaint.`,
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
        "Hi! 👋 I'm here to help with your concerns. How can I assist you today?",
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
            "Hi! 👋 I'm here to help with your concerns. How can I assist you today?",
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
      console.log(
        "🔍 [CUSTOMER CARE CHAT] Complaint status check response:",
        response
      );

      if (response && response.success) {
        const complaint = response.data;

        let reminderSent = false;
        try {
          await complaintAPI.sendReminderNotification(complaintId);
          reminderSent = true;
        } catch (reminderError) {
          console.error(
            "❌ [CUSTOMER CARE CHAT] Error sending reminder notification:",
            reminderError
          );
        }

        let botMessage = "";

        switch (complaint.status) {
          case "pending":
            botMessage = reminderSent
              ? `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: 🟡 **PENDING** - I've sent a reminder to the Customer Care team. They should respond within 24-48 hours. Are there any other issues I can help you with?`
              : `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: 🟡 **PENDING** - The Customer Care team is reviewing your complaint and should respond within 24-48 hours. Are there any other issues I can help you with?`;
            break;
          case "in_progress":
            botMessage = reminderSent
              ? `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: 🔵 **IN PROGRESS** - I've sent a reminder to the assigned team member. They should provide an update soon. Are there any other issues I can help you with?`
              : `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). Current status: 🔵 **IN PROGRESS** - The assigned team member is working on your complaint and should provide an update soon. Are there any other issues I can help you with?`;
            break;
          case "resolved":
            botMessage = reminderSent
              ? `Great news! Your complaint "${complaint.title}" (${complaint.complaintNumber}) has been 🟢 **RESOLVED**! If you haven't received the resolution details, I'll send a reminder to the team to follow up with you directly. Are there any other issues I can help you with?`
              : `Great news! Your complaint "${complaint.title}" (${complaint.complaintNumber}) has been 🟢 **RESOLVED**! If you haven't received the resolution details, please contact the Customer Care team. Are there any other issues I can help you with?`;
            break;
          case "closed":
            botMessage = `Your complaint "${complaint.title}" (${complaint.complaintNumber}) has been ⚫ **CLOSED**. If you have any questions about the resolution, I can help you get in touch with the Customer Care team. Are there any other issues I can help you with?`;
            break;
          default:
            botMessage = reminderSent
              ? `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). I've sent a reminder notification to the Customer Care team about your concern. Are there any other issues I can help you with?`
              : `I've checked your complaint "${complaint.title}" (${complaint.complaintNumber}). The Customer Care team is aware of your concern. Are there any other issues I can help you with?`;
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
        // Try to send reminder even if we can't fetch the complaint details
        let reminderSent = false;
        if (complaintId) {
          try {
            await complaintAPI.sendReminderNotification(complaintId);
            reminderSent = true;
          } catch (reminderError) {
            console.error(
              "❌ [CUSTOMER CARE CHAT] Error sending reminder notification:",
              reminderError
            );
          }
        }

        const errorResponse = {
          id: Date.now(),
          type: "bot",
          message: reminderSent
            ? "I'm having trouble checking your complaint status right now, but I've sent a reminder notification to the Customer Care team about your concern. They should get back to you soon. Please try again later or contact support directly."
            : "I'm having trouble checking your complaint status right now. Please try again later or contact support directly.",
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
      console.error(
        "❌ [CUSTOMER CARE CHAT] Error details:",
        error.response?.data || error.message || error
      );

      // Try to send reminder even on error if we have the complaintId
      let reminderSent = false;
      if (complaintId) {
        try {
          await complaintAPI.sendReminderNotification(complaintId);
          reminderSent = true;
        } catch (reminderError) {
          console.error(
            "❌ [CUSTOMER CARE CHAT] Error sending reminder notification:",
            reminderError
          );
        }
      }

      const errorResponse = {
        id: Date.now(),
        type: "bot",
        message: reminderSent
          ? "I'm having trouble checking your complaint status right now, but I've sent a reminder notification to the Customer Care team about your concern. They should get back to you soon. Please try again later or contact support directly."
          : "I'm having trouble checking your complaint status right now. Please try again later or contact support directly.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorResponse]);
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
          "😕 Your message contains inappropriate content. Please keep your communication professional and related to work issues only. If you have a legitimate complaint, please describe it properly.",
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

    // 2. Handle complaint step-by-step collection (SIMPLIFIED: 4 steps only)
    if (isComplaintMode) {
      if (complaintStep === "category") {
        const categoryText = messageText.toLowerCase();
        let selectedCategory = "other";

        if (categoryText.includes("technical")) selectedCategory = "technical";
        else if (
          categoryText.includes("payroll") ||
          categoryText.includes("finance")
        )
          selectedCategory = "payroll";
        else if (
          categoryText.includes("hr") ||
          categoryText.includes("human resources")
        )
          selectedCategory = "hr";
        else if (categoryText.includes("customer care"))
          selectedCategory = "customer_care";
        else if (
          categoryText.includes("sales") ||
          categoryText.includes("marketing")
        )
          selectedCategory = "sales";
        else if (categoryText.includes("procurement"))
          selectedCategory = "procurement";
        else if (categoryText.includes("inventory"))
          selectedCategory = "inventory";
        else if (categoryText.includes("equipment"))
          selectedCategory = "equipment";
        else if (categoryText.includes("access")) selectedCategory = "access";
        else if (categoryText.includes("policy")) selectedCategory = "policy";
        else if (categoryText.includes("training"))
          selectedCategory = "training";
        else if (categoryText.includes("facilities"))
          selectedCategory = "facilities";
        else if (categoryText.includes("security"))
          selectedCategory = "security";
        else if (
          categoryText.includes("projects") ||
          categoryText.includes("tasks")
        )
          selectedCategory = "projects";
        else if (
          categoryText.includes("documents") ||
          categoryText.includes("files")
        )
          selectedCategory = "documents";

        setComplaintCategory(selectedCategory);

        // Ask for details next (Step 3)
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: "bot",
            message:
              `Great! I've categorized this as **${selectedCategory
                .replace("_", " ")
                .toUpperCase()}**. 🎉` +
              " Now, please tell me more details about your complaint - what exactly happened and how can we help resolve it?",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setComplaintStep("details");
          setShowCategoryButtons(false);
          setIsTyping(false);
        }, 1000);
        return;
      }

      if (complaintStep === "details") {
        // User provided the details - ready to submit (Step 4)
        setFinalComplaintMessage(messageText);
        setComplaintPriority("medium");

        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: "bot",
            message:
              "Thank you for the details! 📝 Ready to submit. Type 'submit' to send this complaint to our Customer Care team. 🚀",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setComplaintStep("submit");
          setIsTyping(false);
        }, 1000);
        return;
      }
    }

    // 3. Handle conversation choice (check status vs new complaint)
    if (conversationState === "waiting_for_choice") {
      const lowerMessage = messageText.toLowerCase().trim();

      // Keywords for checking status (yes)
      const checkStatusKeywords = [
        "yes",
        "yeah",
        "yep",
        "yup",
        "sure",
        "ok",
        "okay",
        "check",
        "status",
        "update",
        "see",
        "show",
        "view",
        "na",
        "abi",
        "sha",
        "ehn", // Nigerian Pidgin confirmations
        "correct",
        "true",
        "right",
      ];

      // Keywords for starting new complaint (no)
      const newComplaintKeywords = [
        "no",
        "nope",
        "not",
        "new",
        "different",
        "another",
        "separate",
        "new complaint",
        "different complaint",
        "another complaint",
        "no be",
        "e no be",
        "abi no",
        "e no be that", // Nigerian Pidgin
      ];

      const wantsToCheckStatus = checkStatusKeywords.some((keyword) =>
        lowerMessage.includes(keyword)
      );

      const wantsNewComplaint = newComplaintKeywords.some((keyword) =>
        lowerMessage.includes(keyword)
      );

      if (wantsToCheckStatus && !wantsNewComplaint) {
        // User wants to check status - fetch complaint status
        const prefetchedComplaintId = sessionStorage.getItem(
          "prefetchedComplaintId"
        );
        if (prefetchedComplaintId) {
          await handleFeedbackCheck(prefetchedComplaintId);
        } else {
          handleFeedbackCheckForRecentComplaint();
        }
        setConversationState("idle");
        return;
      }

      if (wantsNewComplaint || (!wantsToCheckStatus && !wantsNewComplaint)) {
        sessionStorage.removeItem("prefetchedComplaintId");
        setTimeout(() => {
          setIsComplaintMode(true);
          setComplaintStep("category");
          setShowCategoryButtons(true);
          setConversationState("idle");
          const botResponse = {
            id: Date.now() + 1,
            type: "bot",
            message:
              "Great! I'll help you submit a new complaint. 🎯 What's your complaint about? Please choose one:" +
              " 💰 Salary & Pay - Payroll issues, deductions, bonuses, allowances" +
              " 🏖️ Leave & Time Off - Leave requests, attendance, time tracking" +
              " 🖥️ Equipment & IT - Computer problems, equipment requests, technical issues" +
              " 👥 HR & Policies - Employee relations, policies, recruitment" +
              " 🛒 Procurement - Purchasing, vendor issues, purchase orders" +
              " 📦 Inventory - Stock, supplies, equipment tracking" +
              " 📊 Projects & Tasks - Project issues, task assignments" +
              " 🎧 Customer Service - Service issues, support tickets" +
              " 🔐 Access & Security - Login problems, permissions, security" +
              " 📄 Documents & Files - File access, document requests" +
              " ❓ Other - Anything else not listed above" +
              " Just tell me what it's about (e.g., 'Salary' or 'Leave' or 'Equipment')",
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setIsTyping(false);
        }, 1000);
        return;
      }
    }

    // 4. DEFAULT: If not in complaint mode, start complaint mode (Step 1)
    if (!isComplaintMode) {
      setTimeout(() => {
        setIsComplaintMode(true);
        setComplaintStep("category");
        setShowCategoryButtons(true);
        const botResponse = {
          id: Date.now() + 1,
          type: "bot",
          message:
            "Great! I'll help you submit a new complaint. 🎯 What's your complaint about? Please choose one:" +
            " 💰 Salary & Pay - Payroll issues, deductions, bonuses, allowances" +
            " 🏖️ Leave & Time Off - Leave requests, attendance, time tracking" +
            " 🖥️ Equipment & IT - Computer problems, equipment requests, technical issues" +
            " 👥 HR & Policies - Employee relations, policies, recruitment" +
            " 🛒 Procurement - Purchasing, vendor issues, purchase orders" +
            " 📦 Inventory - Stock, supplies, equipment tracking" +
            " 📊 Projects & Tasks - Project issues, task assignments" +
            " 🎧 Customer Service - Service issues, support tickets" +
            " 🔐 Access & Security - Login problems, permissions, security" +
            " 📄 Documents & Files - File access, document requests" +
            " ❓ Other - Anything else not listed above" +
            " Just tell me what it's about (e.g., 'Salary' or 'Leave' or 'Equipment')",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1000);
      return;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartNewComplaint = () => {
    sessionStorage.removeItem("prefetchedComplaintId");

    setIsComplaintMode(true);
    setComplaintStep("category");
    setShowCategoryButtons(true);
    const newComplaintMessage = {
      id: Date.now(),
      type: "bot",
      message:
        "Great! I'll help you submit a new complaint. 🎯 What's your complaint about? Please choose one:" +
        " 💰 Salary & Pay - Payroll issues, deductions, bonuses, allowances" +
        " 🏖️ Leave & Time Off - Leave requests, attendance, time tracking" +
        " 🖥️ Equipment & IT - Computer problems, equipment requests, technical issues" +
        " 👥 HR & Policies - Employee relations, policies, recruitment" +
        " 🛒 Procurement - Purchasing, vendor issues, purchase orders" +
        " 📦 Inventory - Stock, supplies, equipment tracking" +
        " 📊 Projects & Tasks - Project issues, task assignments" +
        " 🎧 Customer Service - Service issues, support tickets" +
        " 🔐 Access & Security - Login problems, permissions, security" +
        " 📄 Documents & Files - File access, document requests" +
        " ❓ Other - Anything else not listed above" +
        " Just tell me what it's about (e.g., 'Salary' or 'Leave' or 'Equipment')",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newComplaintMessage]);
    setShowHistoryOptions(false);
  };

  const handleSubmitComplaintFromSession = async () => {
    try {
      setIsSubmittingComplaint(true);

      // Generate title from description (first 50 chars or first sentence)
      const generateTitle = (desc) => {
        if (!desc)
          return `Customer Care Complaint - ${new Date().toLocaleDateString()}`;
        const firstSentence = desc.split(/[.!?]/)[0].trim();
        if (firstSentence.length > 50) {
          return firstSentence.substring(0, 47) + "...";
        }
        return (
          firstSentence ||
          desc.substring(0, 50) ||
          `Customer Care Complaint - ${new Date().toLocaleDateString()}`
        );
      };

      const title =
        generateTitle(finalComplaintMessage) ||
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
        if (!avatarPath) return "/defaulticon.jpg";
        if (avatarPath.startsWith("http")) return avatarPath;

        const baseUrl = (import.meta.env.VITE_API_URL || "/api").replace(
          "/api",
          ""
        );
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

      // Clean description - just the actual complaint message
      const cleanDescription =
        finalComplaintMessage || "User complaint details from chat session";

      const complaintData = {
        title,
        description: cleanDescription,
        category: complaintCategory || "other",
        priority: complaintPriority || "medium",
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

        toast.success("Complaint submitted successfully! 🎉");

        const successMessage = {
          id: Date.now(),
          type: "bot",
          message: `🎉 Complaint submitted successfully! Your complaint number is: ${
            response.data.complaintNumber || "CC-XXXXXX"
          }. You can check for updates on your tickets or you'll be notified when resolved. 😊`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, successMessage]);

        setIsComplaintMode(false);
        setChatSession([]);
        setComplaintTitle("");
        setComplaintCategory("");
        setComplaintPriority("");
        setComplaintStep("category");
        setShowCategoryButtons(false);
        setShowPriorityButtons(false);
        setIsTyping(false);
      } else {
        toast.error("Failed to submit complaint. Please try again. 😔");
        setIsTyping(false);
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint. Please try again.");
      setIsTyping(false);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const quickActions = [
    {
      icon: HiTicket,
      label: "Submit Complaint",
      action: () => {
        handleStartNewComplaint();
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
        const prefetchedComplaintId = sessionStorage.getItem(
          "prefetchedComplaintId"
        );
        if (prefetchedComplaintId) {
          handleFeedbackCheck(prefetchedComplaintId);
        } else {
          handleFeedbackCheckForRecentComplaint();
        }
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

                {/* Category Selection Buttons */}
                {showCategoryButtons && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-blue-50 p-4 rounded-2xl max-w-[80%]">
                      <p className="text-sm font-medium text-blue-800 mb-3">
                        🎯 Quick Select Category:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            key: "technical",
                            label: "💻 Technical",
                            emoji: "💻",
                          },
                          { key: "payroll", label: "💰 Payroll", emoji: "💰" },
                          { key: "hr", label: "👥 HR", emoji: "👥" },
                          {
                            key: "customer_care",
                            label: "🎧 Customer Care",
                            emoji: "🎧",
                          },
                          { key: "sales", label: "📈 Sales", emoji: "📈" },
                          {
                            key: "procurement",
                            label: "🛒 Procurement",
                            emoji: "🛒",
                          },
                          {
                            key: "inventory",
                            label: "📦 Inventory",
                            emoji: "📦",
                          },
                          {
                            key: "equipment",
                            label: "🖥️ Equipment",
                            emoji: "🖥️",
                          },
                          { key: "access", label: "🔐 Access", emoji: "🔐" },
                          { key: "policy", label: "📋 Policy", emoji: "📋" },
                          {
                            key: "training",
                            label: "🎓 Training",
                            emoji: "🎓",
                          },
                          {
                            key: "facilities",
                            label: "🏢 Facilities",
                            emoji: "🏢",
                          },
                          {
                            key: "security",
                            label: "🛡️ Security",
                            emoji: "🛡️",
                          },
                          {
                            key: "projects",
                            label: "📊 Projects",
                            emoji: "📊",
                          },
                          {
                            key: "documents",
                            label: "📄 Documents",
                            emoji: "📄",
                          },
                          { key: "other", label: "❓ Other", emoji: "❓" },
                        ].map((category) => (
                          <button
                            key={category.key}
                            onClick={() => {
                              setComplaintCategory(category.key);
                              setNewMessage(category.label);
                              setShowCategoryButtons(false);
                              // Trigger the message handling
                              setTimeout(() => {
                                handleSendMessage();
                              }, 100);
                            }}
                            className="p-2 text-xs bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-blue-700"
                          >
                            {category.emoji}{" "}
                            {category.label.split(" ")[1] || category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Priority Selection Buttons */}
                {showPriorityButtons && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-green-50 p-4 rounded-2xl max-w-[80%]">
                      <p className="text-sm font-medium text-green-800 mb-3">
                        ⚡ Quick Select Priority:
                      </p>
                      <div className="flex space-x-2">
                        {[
                          { key: "low", label: "🟢 Low", emoji: "🟢" },
                          { key: "medium", label: "🟡 Medium", emoji: "🟡" },
                          { key: "high", label: "🔴 High", emoji: "🔴" },
                        ].map((priority) => (
                          <button
                            key={priority.key}
                            onClick={() => {
                              setComplaintPriority(priority.key);
                              setNewMessage(priority.label);
                              setShowPriorityButtons(false);
                              // Trigger the message handling
                              setTimeout(() => {
                                handleSendMessage();
                              }, 100);
                            }}
                            className="p-3 text-sm bg-white hover:bg-green-100 border border-green-200 rounded-lg transition-colors text-green-700 font-medium"
                          >
                            {priority.emoji} {priority.label.split(" ")[1]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

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

                {/* Quick Actions */}
                {!isComplaintMode && (
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Quick Actions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          <action.icon className="w-4 h-4 text-gray-600" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
