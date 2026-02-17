"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/");
        return;
      }

      setUser(data.user);

      const { data: bookmarkData, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) {
        setBookmarks(bookmarkData || []);
      }
    };

    init();
  }, [router]);

  const handleAddBookmark = async () => {
  if (!title || !url || !user) return;

  const { data, error } = await supabase.from("bookmarks").insert([
    {
      title,
      url,
      user_id: user.id,
    },
  ]);

  if (error) {
    console.error("Insert error:", error);
    alert(error.message);
    return;
  }

  console.log("Inserted:", data);

  setTitle("");
  setUrl("");

  const { data: updated } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  setBookmarks(updated || []);
};

  const handleDelete = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);

    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-gray-200 font-bold">Your Bookmarks</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-gray-200 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-6 text-gray-200">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 flex-1 text-gray-200"
        />
        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 flex-1"
        />
        <button
          onClick={handleAddBookmark}
          className="bg-black text-gray-200 px-4"
        >
          Add
        </button>
      </div>

      <ul className="space-y-3 text-gray-200">
        {bookmarks.map((bookmark) => (
          <li
            key={bookmark.id}
            className="border p-4 flex justify-between items-center"
          >
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200"
            >
              {bookmark.title}
            </a>
            <button
              onClick={() => handleDelete(bookmark.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
