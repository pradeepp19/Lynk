"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at?: string;
};

type ViewMode = "list" | "card";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const router = useRouter();

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  // Handle auth + session
  useEffect(() => {
    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUser(session.user);
      await fetchBookmarks(session.user.id);
    };

    setup();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          router.push("/");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Realtime subscription with explicit auth token + user_id guards
  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`bookmarks-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookmarks" },
          (payload) => {
            console.log("Realtime event received:", payload);

            if (payload.eventType === "INSERT") {
              const newBookmark = payload.new as Bookmark;
              if (newBookmark.user_id !== user.id) return;
              setBookmarks((prev) => {
                if (prev.some((b) => b.id === newBookmark.id)) return prev;
                return [newBookmark, ...prev];
              });
            } else if (payload.eventType === "DELETE") {
              const deleted = payload.old as Bookmark;
              if (deleted.user_id && deleted.user_id !== user.id) return;
              setBookmarks((prev) => prev.filter((b) => b.id !== deleted.id));
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as Bookmark;
              if (updated.user_id !== user.id) return;
              setBookmarks((prev) =>
                prev.map((b) => (b.id === updated.id ? updated : b))
              );
            }
          }
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);

          // ✅ Key fix: re-fetch whenever we (re)connect so we never miss events
          // that happened during CLOSED/CHANNEL_ERROR period
          if (status === "SUBSCRIBED") {
            fetchBookmarks(user.id);
          }
        });
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAdd = async () => {
    if (!title || !url || !user) return;

    const trimmedUrl = url.startsWith("http") ? url : `https://${url}`;

    // Optimistic update — instant feedback on Tab 1
    const tempId = crypto.randomUUID();
    const optimisticBookmark: Bookmark = {
      id: tempId,
      title,
      url: trimmedUrl,
      user_id: user.id,
    };
    setBookmarks((prev) => [optimisticBookmark, ...prev]);
    setTitle("");
    setUrl("");

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ title, url: trimmedUrl, user_id: user.id })
      .select()
      .single();

    if (error) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      console.error("Insert error:", error);
    } else if (data) {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === tempId ? (data as Bookmark) : b))
      );
    }
  };

  const handleDelete = async (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center py-4 px-6 md:px-12 border-b border-gray-800 sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-violet-400">Lynk</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-8 h-8 rounded-full border border-gray-700"
              />
            )}
            <span className="text-sm text-gray-400 hidden md:block">
              {user.user_metadata?.full_name || user.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="border border-red-500 text-red-400 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">

        {/* ADD BOOKMARK FORM */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-violet-400 mb-4">Add a new bookmark</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Title"
              className="flex-1 p-3 bg-[#121212] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="URL (e.g. https://example.com)"
              className="flex-1 p-3 bg-[#121212] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!title || !url}
              className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        </div>

        {/* HEADER + VIEW TOGGLE */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-200">
            Your Bookmarks{" "}
            <span className="text-sm text-gray-500 font-normal">
              ({bookmarks.length})
            </span>
          </h2>

          {/* List / Card toggle */}
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                viewMode === "list"
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              List
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                viewMode === "card"
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Cards
            </button>
          </div>
        </div>

        {/* EMPTY STATE */}
        {bookmarks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-lg">No bookmarks yet</p>
            <p className="text-sm mt-1 text-gray-700">Add your first link above</p>
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === "list" && bookmarks.length > 0 && (
          <ul className="space-y-3">
            {bookmarks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-gray-800 hover:border-violet-800 transition-colors duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getFavicon(b.url) && (
                    <img
                      src={getFavicon(b.url)!}
                      alt=""
                      className="w-5 h-5 rounded shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <div className="min-w-0">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-gray-200 hover:text-violet-400 transition-colors truncate block"
                    >
                      {b.title}
                    </a>
                    <span className="text-xs text-gray-500 truncate block">
                      {getDomain(b.url)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors duration-200 shrink-0 ml-4 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* CARD VIEW — 3 per row */}
        {viewMode === "card" && bookmarks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="flex flex-col justify-between p-5 bg-[#1a1a1a] rounded-2xl border border-gray-800 hover:border-violet-700 transition-all duration-200 group relative"
              >
                <button
                  onClick={() => handleDelete(b.id)}
                  className="absolute top-3 right-3 text-gray-600 hover:text-red-400 transition-colors duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-center gap-2 mb-3">
                  {getFavicon(b.url) && (
                    <img
                      src={getFavicon(b.url)!}
                      alt=""
                      className="w-5 h-5 rounded shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <span className="text-xs text-gray-500 truncate">
                    {getDomain(b.url)}
                  </span>
                </div>

                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-gray-200 hover:text-violet-400 transition-colors line-clamp-2 mb-4 block"
                >
                  {b.title}
                </a>

                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-300 transition-colors mt-auto"
                >
                  Open link
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
