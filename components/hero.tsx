"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const HeroSection = () => {
  const imageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const imageElement = imageRef.current;
      if (!imageElement) return;

      const scrollPosition = window.scrollY;
      const scrollThreshold = 100; // Adjust this value as needed

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
          Manage Your Finances <br /> Effortlessly with BudgeTX
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          BudgeTX is a personal AI-powered finance management platform that
          helps you track your expenses, set budgets, and achieve your financial
          goals with ease. Our intuitive interface and powerful features make it
          simple to take control of your finances and make informed decisions
          about your money.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard ">
            <Button className="px-8" size="lg">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard ">
            <Button variant="outline" className="px-8" size="lg">
              Watch Demo
            </Button>
          </Link>
        </div>
        <div className="hero-img-wrapper">
          <div ref={imageRef} className="hero-image">
            <Image
              src="/banner.jpeg"
              alt="DashBoard Preview"
              width={1280}
              height={720}
              className="rounded-lg mt-10 shadow-2xl border mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
