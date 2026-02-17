"use client";

import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-violet-600 ">
      <nav className="flex justify-between items-center py-6 px-6 md:px-12">
        <h1 className="text-2xl font-bold cursor-pointer">Lynk</h1>
        <button
          onClick={handleLogin}
          className="bg-[#121212] font-bold text-white-400 hover:border-transparent hover:bg-purple-600 hover:text-white active:bg-purple-700 px-4 py-2 cursor-pointer rounded-lg hover:opacity-80 transition-colors duration-300 "
        >
          Login
        </button>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Organize Your Bookmarks.
          <br />
          <span className="text-violet-600">
            Access them anywhere.
          </span>
        </h2>

        <p className="text-lg text-gray-200 mb-8 max-w-2xl">
          A simple, private, and real-time bookmark manager.
          Keep your links Private, mark them done, and keep your
          digital life clean.
        </p>


  <button
  onClick={handleLogin}
  aria-label="Sign in with Google"
  className=" hover:bg-gray-700 utline-offset-2 outline-white-400 shadow-indigo-500/50 cursor-pointer focus:outline flex items-center gap-3 bg-google-button-blue rounded-full p-0.5 pr-4 transition-colors duration-300 hover:bg-google-button-blue-hover"
>
  <div className="flex items-center justify-center bg-white w-9 h-9 rounded-full">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
      <title>Sign in with Google</title>
      <desc>Google G Logo</desc>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        className="fill-google-logo-blue"
      ></path>
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        className="fill-google-logo-green"
      ></path>
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        className="fill-google-logo-yellow"
      ></path>
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        className="fill-google-logo-red"
      ></path>
    </svg>
  </div>
  <span className="text-sm text-white tracking-wider">Sign in with Google</span>
</button>
</section>

<section className="px-6 md:px-12 py-20 bg-[#121212]">
<div className="max-w-5xl mx-auto">
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
      <video
        src="/bookmark.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-auto"
      />
    </div>
  </div>
</section>

      {/* FEATURES */}
      <section className=" py-20 bg-[#121212] text-violet-600">
        <div className="max-w-6xl bg-[#121212] mx-auto px-6 grid md:grid-cols-3 gap-10">
          
          <div className="p-6 bg-[#121212] rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">
              🔐 Private & Secure
            </h3>
            <p className="text-gray-200">
              Your bookmarks are visible only to you.
              Powered by secure authentication and row-level security.
            </p>
          </div>

          <div className="p-6 bg-[#121212] rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">
              ⚡ Real-time Sync
            </h3>
            <p className="text-gray-200">
              Open two tabs and see changes instantly.
              No page refresh required.
            </p>
          </div>

          <div className="p-6 bg-[#121212]rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-3">
              📂 Smart Organization
            </h3>
            <p className="text-gray-200">
              Group bookmarks by topic and mark them as done
              once completed.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
