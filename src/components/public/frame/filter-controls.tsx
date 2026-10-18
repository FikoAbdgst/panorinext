"use client";

import Link from "next/link";
import { useState } from "react";

export type CatalogFilterState = {
  activeSort: boolean;
  ratingHref: string;
  ratingLabel: string;
  ratingActive: boolean;
  ratingIconPath: string;
  popularHref: string;
  popularLabel: string;
  popularActive: boolean;
  popularIconPath: string;
  defaultHref: string;
  defaultActive: boolean;
  freeHref: string;
  freeActive: boolean;
  frameCount: number;
};

function FilterArrow({ open }: { open: boolean }) {
  return (
    <svg
      id="filterArrow"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function ActiveDot({ show }: { show: boolean }) {
  return (
    <div
      className={`w-3 h-3 bg-green-500 absolute -top-1 -right-1 z-50 rounded-full ${
        show ? "" : "hidden"
      } `}
    />
  );
}

export function FilterControls({ filters }: { filters: CatalogFilterState }) {
  const [open, setOpen] = useState(false);

  const ratingIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={filters.ratingIconPath} />
    </svg>
  );
  const ratingIconSmall = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={filters.ratingIconPath} />
    </svg>
  );
  const popularIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={filters.popularIconPath} />
    </svg>
  );
  const popularIconSmall = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={filters.popularIconPath} />
    </svg>
  );
  const defaultIconSmall = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
  const freeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
  const freeIconSmall = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
  const countIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#BF3131]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );

  return (
    <>
      {/* Mobile Filter Layout */}
      <div className="block sm:hidden">
        <button
          id="toggleFilter"
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="w-full relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg border border-gray-300 transition-all duration-300 text-sm font-medium text-gray-700 mb-3"
        >
          <div className="flex items-center gap-2">
            <FilterIcon />
            <span>Filter &amp; Urutkan</span>
          </div>
          <FilterArrow open={open} />
          <ActiveDot show={filters.activeSort} />
        </button>

        <div id="filterOptions" className={open ? "space-y-2 animate-fade-in mb-4" : "hidden space-y-2 animate-fade-in mb-4"}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">Urutkan</label>
            <div className="flex gap-2">
              <Link
                href={filters.ratingHref}
                className={`mobile-rating-filter-btn flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                  filters.ratingActive ? "active" : ""
                }`}
              >
                {ratingIcon}
                <span>{`Rating ${filters.ratingLabel}`}</span>
              </Link>
              <Link
                href={filters.popularHref}
                className={`mobile-popular-filter-btn flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                  filters.popularActive ? "active" : ""
                }`}
              >
                {popularIcon}
                <span>{`Popularitas ${filters.popularLabel}`}</span>
              </Link>
              <Link
                href={filters.defaultHref}
                className={`mobile-default-filter-btn flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                  filters.defaultActive ? "active" : ""
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Default</span>
              </Link>
            </div>
          </div>
        </div>

        <Link
          href={filters.freeHref}
          className={`mobile-free-filter-btn flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
            filters.freeActive ? "active" : ""
          }`}
        >
          {freeIcon}
          <span>Gratis</span>
        </Link>
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#FEF3E2] to-red-50 px-4 py-3 mt-5 rounded-lg border border-red-200">
          {countIcon}
          <span className="text-sm font-medium text-gray-700">
            <span className="font-bold text-[#BF3131]">{filters.frameCount}</span> Frame Tersedia
          </span>
        </div>
      </div>

      {/* Desktop Filter Layout */}
      <div className="hidden sm:flex sm:flex-row gap-4 justify-between items-center" data-aos="fade-up" data-aos-delay="200">
        <div className="flex items-center gap-4">
          <button
            id="toggleFilter"
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex relative items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-lg border border-gray-300 transition-all duration-300 text-sm font-medium text-gray-700"
          >
            <FilterIcon />
            <span>Filter &amp; Urutkan</span>
            <FilterArrow open={open} />
            <ActiveDot show={filters.activeSort} />
          </button>

          <div
            id="filterOptions"
            className={`${open ? "flex" : "hidden"} gap-3 animate-fade-in`}
          >
            <div className="flex items-center gap-1">
              <Link
                href={filters.ratingHref}
                className={`rating-filter-btn flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 border ${
                  filters.ratingActive ? "active" : ""
                }`}
              >
                {ratingIconSmall}
                <span>{`Rating ${filters.ratingLabel}`}</span>
              </Link>
            </div>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center gap-1">
              <Link
                href={filters.popularHref}
                className={`popular-filter-btn flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 border ${
                  filters.popularActive ? "active" : ""
                }`}
              >
                {popularIconSmall}
                <span>{`Popularitas ${filters.popularLabel}`}</span>
              </Link>
            </div>
            <div className="w-px h-6 bg-gray-300" />
            <Link
              href={filters.defaultHref}
              className={`default-filter-btn flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 border ${
                filters.defaultActive ? "active" : ""
              }`}
            >
              {defaultIconSmall}
              <span>Default</span>
            </Link>
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center gap-1">
              <Link
                href={filters.freeHref}
                className={`free-filter-btn flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 border ${
                  filters.freeActive ? "active" : ""
                }`}
              >
                {freeIconSmall}
                <span>Gratis</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-[#FEF3E2] to-red-50 px-4 py-2 rounded-lg border border-red-200">
          {countIcon}
          <span className="text-sm font-medium text-gray-700">
            <span className="font-bold text-[#BF3131]">{filters.frameCount}</span> Frame
          </span>
        </div>
      </div>
    </>
  );
}
