"use client";

import Image from "next/image";
import { apiClient } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Home() {
  const [apiResponse, setApiResponse] = useState<any>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await apiClient.get('/');
        console.log(response);
        setApiResponse(response);
      } catch (error) {
        console.error('API Error:', error);
      }
    };

    testApi();
  }, []);
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
      </header>
      <main>
        <h1>Money Intelligence</h1>
        {apiResponse && (
          <div>
            <h2>API Connected!</h2>
            <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
