import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { gsap } from "gsap";

// YouTube API key and playlist mapping per platform
const youtubeApiKey =import.meta.env.VITE_API_KEY ;
const playlistMapping = {
  leetcode: "PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr",
  codechef: "PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr",
  codeforces: "PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB",
};

// Updated platform logos with new URLs
const platformLogos = {
  Codeforces:
    "https://sta.codeforces.com/s/64554/images/codeforces-logo.png",
  Codechef:
    "https://s3.amazonaws.com/codechef_shared/sites/all/themes/abessive/logo.png",
  Leetcode: "https://leetcode.com/static/images/LeetCode_logo_rvs.png",
};

// Convert a JavaScript Date to an IST string.
const formatToIST = (date) =>
  date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

// Calculate remaining time until contest start.
const getTimeRemaining = (startTime) => {
  const now = new Date();
  const diffMs = startTime - now;
  if (diffMs <= 0) return "Started";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec >= 86400) {
    const days = Math.floor(diffSec / 86400);
    return `${days} day${days > 1 ? "s" : ""} remaining`;
  } else {
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  }
};

// Normalize CodeForces contest data.
const mapCodeforcesContest = (contest) => ({
  id: `cf-${contest.id}`,
  name: contest.name,
  startTime: new Date(contest.startTimeSeconds * 1000),
  duration: contest.durationSeconds / 3600,
  phase: contest.phase === "BEFORE" ? "BEFORE" : "FINISHED",
  platform: "Codeforces",
  href: `https://codeforces.com/contest/${contest.id}`,
});

// Normalize clist contest data (for Codechef and LeetCode).
const mapClistContest = (contest) => {
  let platform = "";
  if (contest.resource.toLowerCase().includes("leetcode.com")) {
    platform = "Leetcode";
  } else if (contest.resource.toLowerCase().includes("codechef.com")) {
    platform = "Codechef";
  }
  return {
    id: `clist-${contest.id}`,
    name: contest.event,
    startTime: new Date(contest.start + "Z"),
    endTime: new Date(contest.end + "Z"),
    duration: contest.duration / 3600,
    platform,
    href: contest.href,
  };
};

const ContestCard = ({ contest, isBookmarked, toggleBookmark }) => {
  const { name, startTime, duration, platform, href } = contest;
  const cardRef = useRef(null);
  const contestEndTime = contest.endTime
    ? contest.endTime
    : new Date(startTime.getTime() + duration * 3600 * 1000);

  const now = new Date();
  let contestStatus = "";
  if (now < startTime) {
    contestStatus = "Upcoming";
  } else if (now >= startTime && now < contestEndTime) {
    contestStatus = "Running";
  } else {
    contestStatus = "Past";
  }

  const timeRemaining =
    contestStatus === "Upcoming" ? getTimeRemaining(startTime) : null;

  // GSAP animations for card
  useEffect(() => {
    if (cardRef.current) {
      // Initial animation
      gsap.fromTo(
        cardRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Set up hover animations
      cardRef.current.addEventListener("mouseenter", () => {
        gsap.to(cardRef.current, {
          scale: 1.03,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          duration: 0.3,
          ease: "power2.out",
        });
      });

      cardRef.current.addEventListener("mouseleave", () => {
        gsap.to(cardRef.current, {
          scale: 1,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          duration: 0.3,
          ease: "power2.out",
        });
      });

      // Clean up
      return () => {
        if (cardRef.current) {
          cardRef.current.removeEventListener("mouseenter", () => {});
          cardRef.current.removeEventListener("mouseleave", () => {});
        }
      };
    }
  }, []);

  const handleYouTubeSolution = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const platformKey = contest.platform.toLowerCase();
    const playlistId = playlistMapping[platformKey];
    if (!playlistId) {
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          contest.name + " TLE Eliminator"
        )}&autoplay=1`,
        "_blank"
      );
      return;
    }
    try {
      gsap.to(e.currentTarget, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
      });

      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet",
            playlistId: playlistId,
            maxResults: 50,
            key: youtubeApiKey,
          },
        }
      );
      const items = response.data.items;
      let foundVideo = null;
      const coreContestName = contest.name.split("(")[0].trim().toLowerCase();
      let targetDivision = "";
      const divisionMatch = contest.name.match(/\((.*?)\)/);
      if (divisionMatch) {
        const divisionText = divisionMatch[1].toLowerCase();
        if (divisionText.includes("div. 1")) {
          targetDivision = "div. 1";
        } else if (divisionText.includes("div. 2")) {
          targetDivision = "div. 2";
        }
      }
      if (targetDivision) {
        for (const item of items) {
          const videoTitle = item.snippet.title.toLowerCase();
          if (
            videoTitle.includes(coreContestName) &&
            videoTitle.includes(targetDivision)
          ) {
            foundVideo = item;
            break;
          }
        }
      }
      if (!foundVideo) {
        for (const item of items) {
          const videoTitle = item.snippet.title.toLowerCase();
          if (videoTitle.includes(coreContestName)) {
            foundVideo = item;
            break;
          }
        }
      }
      if (foundVideo) {
        const videoId = foundVideo.snippet.resourceId.videoId;
        const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        window.open(videoUrl, "_blank");
      } else {
        toast.info("Video not uploaded yet.");
      }
    } catch (error) {
      console.error("Error searching playlist:", error);
      toast.error("Error searching video.");
    }
  };

  // Updated dark mode card gradients and border colors
  const getCardStyle = () => {
    if (contestStatus === "Upcoming") {
      return "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-l-4 border-blue-600";
    } else if (contestStatus === "Running") {
      return "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border-l-4 border-green-600";
    } else {
      return "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900 border-l-4 border-gray-600";
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block cursor-pointer"
      style={{ perspective: "1000px" }}
    >
      <div
        ref={cardRef}
        className={`group relative w-full sm:w-[400px] min-h-[220px] p-6 rounded-2xl transition-all duration-300 ${getCardStyle()} shadow-lg backdrop-blur-sm transform`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Bookmark Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            gsap.to(e.currentTarget, {
              rotation: isBookmarked ? -30 : 30,
              duration: 0.3,
              ease: "back.out(1.7)",
            });
            toggleBookmark(contest.id);
          }}
          className="absolute top-4 right-4 text-yellow-500 hover:text-yellow-600 focus:outline-none transition-all duration-200 hover:scale-110 cursor-pointer"
        >
          {isBookmarked ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 .587l3.668 7.571L24 9.423l-6 5.848L19.336 24 12 19.897 4.664 24 6 15.271 0 9.423l8.332-1.265z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.108 6.504a1 1 0 00.95.69h6.837c.969 0 1.371 1.24.588 1.81l-5.543 4.032a1 1 0 00-.364 1.118l2.108 6.504c.3.921-.755 1.688-1.54 1.118l-5.543-4.032a1 1 0 00-1.175 0l-5.543 4.032c-.784.57-1.838-.197-1.54-1.118l2.108-6.504a1 1 0 00-.364-1.118L2.066 12.93c-.783-.57-.38-1.81.588-1.81h6.837a1 1 0 00.95-.69l2.108-6.504z"
              />
            </svg>
          )}
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-md">
                <img
                  src={platformLogos[platform]}
                  alt={`${platform} logo`}
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-700"></div>
            </div>
            <div className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-2">
              {name}
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold text-white rounded-full shadow-md bg-gradient-to-r ${
              contestStatus === "Upcoming"
                ? "from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500"
                : contestStatus === "Running"
                ? "from-green-500 to-green-600 dark:from-green-400 dark:to-green-500"
                : "from-gray-500 to-gray-600 dark:from-gray-400 dark:to-gray-500"
            }`}
          >
            {contestStatus}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {contestStatus === "Upcoming" ? (
            <>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Starts at: {formatToIST(startTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Duration: {duration} hours</span>
              </div>
              <div className="flex items-center space-x-2 font-medium text-blue-500 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{timeRemaining}</span>
              </div>
            </>
          ) : contestStatus === "Running" ? (
            <>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Started at: {formatToIST(startTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ends at: {formatToIST(contestEndTime)}</span>
              </div>
              <div className="flex items-center space-x-2 font-medium text-green-500 dark:text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Running</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ended at: {contest.endTime ? formatToIST(contest.endTime) : formatToIST(contestEndTime)}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Past</span>
              </div>
              <button
                onClick={handleYouTubeSolution}
                className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-md hover:shadow-lg cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Watch Solution</span>
              </button>
            </>
          )}
        </div>
      </div>
    </a>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [codeforcesContests, setCodeforcesContests] = useState([]);
  const [clistUpcomingContests, setClistUpcomingContests] = useState([]);
  const [clistPastContests, setClistPastContests] = useState([]);
  const [bookmarked, setBookmarked] = useState([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    Codeforces: true,
    Leetcode: true,
    Codechef: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const headerRef = useRef(null);
  const filtersRef = useRef(null);
  const upcomingTitleRef = useRef(null);
  const pastTitleRef = useRef(null);
  const upcomingRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    gsap.fromTo(
      headerRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
    gsap.fromTo(
      filtersRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
    );
    gsap.fromTo(
      upcomingTitleRef.current,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, delay: 0.4, ease: "power3.out" }
    );
    gsap.fromTo(
      pastTitleRef.current,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: "power3.out" }
    );
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - upcomingRef.current.offsetLeft);
    setScrollLeft(upcomingRef.current.scrollLeft);
    upcomingRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (upcomingRef.current) {
      upcomingRef.current.style.cursor = "grab";
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (upcomingRef.current) {
      upcomingRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - upcomingRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    upcomingRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleWheel = useCallback((e) => {
    if (upcomingRef.current) {
      e.preventDefault();
      upcomingRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  useEffect(() => {
    const upcomingElement = upcomingRef.current;
    if (upcomingElement) {
      upcomingElement.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        upcomingElement.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  const toggleBookmark = (contestId) => {
    setBookmarked((prev) =>
      prev.includes(contestId)
        ? prev.filter((id) => id !== contestId)
        : [...prev, contestId]
    );
    if (!bookmarked.includes(contestId)) {
      toast.success("Contest bookmarked!");
    } else {
      toast.info("Bookmark removed");
    }
  };

  useEffect(() => {
    const fetchCFContests = async () => {
      try {
        const response = await fetch(
          "https://codeforces.com/api/contest.list?gym=false"
        );
        const data = await response.json();
        if (data.status === "OK") {
          const mapped = data.result.map(mapCodeforcesContest);
          setCodeforcesContests(mapped);
        } else {
          console.error("CodeForces error:", data.comment);
        }
      } catch (error) {
        console.error("CodeForces fetch error:", error);
      }
    };
    fetchCFContests();
  }, []);

  useEffect(() => {
    const fetchClistUpcoming = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const oneMonthFuture = now + 30 * 24 * 3600;
        const response = await axios.get("https://clist.by/api/v2/contest/", {
          params: {
            username: "karansingh21202",
            api_key: "31b42a9b8f0f44e85b0ef75d49ac9539d4162c07",
            resource__in: "leetcode.com,codechef.com",
            start__gte: new Date(now * 1000).toISOString(),
            start__lte: new Date(oneMonthFuture * 1000).toISOString(),
            order_by: "start",
            limit: 100,
          },
        });
        const data = response.data;
        if (data.objects) {
          const mapped = data.objects.map(mapClistContest);
          const nowDate = new Date();
          mapped.forEach((contest) => {
            contest.phase = contest.startTime > nowDate ? "BEFORE" : "FINISHED";
          });
          setClistUpcomingContests(mapped);
        }
      } catch (error) {
        console.error("Clist upcoming fetch error:", error);
      }
    };
    fetchClistUpcoming();
  }, []);

  useEffect(() => {
    const fetchClistPast = async () => {
      setIsLoading(true);
      try {
        const now = Math.floor(Date.now() / 1000);
        const oneMonthAgo = now - 30 * 24 * 3600;
        const response = await axios.get("https://clist.by/api/v2/contest/", {
          params: {
            username: "karansingh21202",
            api_key:import.meta.env.VITE_API_KEY2 ,
            resource__in: "leetcode.com,codechef.com",
            end__gte: new Date(oneMonthAgo * 1000).toISOString(),
            end__lte: new Date(now * 1000).toISOString(),
            order_by: "-end",
            limit: 100,
          },
        });
        const data = response.data;
        if (data.objects) {
          const mapped = data.objects
            .map(mapClistContest)
            .filter((contest) => contest.endTime < new Date());
          mapped.forEach((contest) => (contest.phase = "FINISHED"));
          setClistPastContests(mapped);
        }
      } catch (error) {
        console.error("Clist past fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClistPast();
  }, []);

  const upcomingContests = [
    ...codeforcesContests.filter((c) => c.phase === "BEFORE"),
    ...clistUpcomingContests.filter((c) => c.phase === "BEFORE"),
  ];

  const pastContests = [
    ...codeforcesContests.filter((c) => c.phase === "FINISHED"),
    ...clistUpcomingContests.filter((c) => c.phase === "FINISHED"),
    ...clistPastContests,
  ];

  const filterContests = (contests) =>
    contests.filter((c) => selectedPlatforms[c.platform]);

  const applyBookmarkFilter = (contests) =>
    showBookmarksOnly ? contests.filter((c) => bookmarked.includes(c.id)) : contests;

  const handleFilterChange = (platform) => {
    setSelectedPlatforms((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
    gsap.fromTo(
      ".contest-card",
      { scale: 0.95, opacity: 0.7 },
      { scale: 1, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
    );
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <ToastContainer />
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${darkMode ? "#1a1a1a" : "#f1f1f1"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? "#4a5568" : "#888"};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? "#718096" : "#555"};
        }
      `}</style>
      <div
        className={`min-h-screen p-6 transition-colors duration-300 ${
          darkMode ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Coding Contests Hub
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 text-gray-900 dark:text-gray-200 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Filter UI */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Filters
            </h2>
            <div className="flex flex-wrap gap-4">
              {Object.keys(selectedPlatforms).map((platform) => (
                <label
                  key={platform}
                  className="flex items-center space-x-2 cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms[platform]}
                    onChange={() => handleFilterChange(platform)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {platform}
                  </span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={showBookmarksOnly}
                  onChange={() => setShowBookmarksOnly((prev) => !prev)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Show Bookmarks Only
                </span>
              </label>
            </div>
          </div>

          {/* Upcoming Contests */}
          <section className="mb-12">
            <h2
              ref={upcomingTitleRef}
              className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100"
            >
              Upcoming Contests
            </h2>
            <div
              ref={upcomingRef}
              className="flex overflow-x-auto space-x-6 pb-6 select-none cursor-grab scrollbar-hide"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
            >
              {applyBookmarkFilter(filterContests(upcomingContests)).map(
                (contest) => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    isBookmarked={bookmarked.includes(contest.id)}
                    toggleBookmark={toggleBookmark}
                  />
                )
              )}
              {applyBookmarkFilter(filterContests(upcomingContests)).length === 0 && (
                <div className="w-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg">
                    No upcoming contests for the selected filters.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Past Contests */}
          <section>
            <h2
              ref={pastTitleRef}
              className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100"
            >
              Recent Past Contests
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {applyBookmarkFilter(filterContests(pastContests)).map((contest) => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  isBookmarked={bookmarked.includes(contest.id)}
                  toggleBookmark={toggleBookmark}
                />
              ))}
              {applyBookmarkFilter(filterContests(pastContests)).length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg">
                    No recent past contests for the selected filters.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
