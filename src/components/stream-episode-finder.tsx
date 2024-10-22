"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import Fuse from "fuse.js";
import moment from "moment";
import { Search, ExternalLink, Youtube } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Episode = {
  date: string;
  articleLink: string;
  streamTitle: string;
  streamLink: string;
};

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQl0fYlik6fvtVqSZ0MrFS9LugV8izIwbc9GPSAcOELk4tyhixYMT1K5OpJX4LZgHHE9s6O6ZwCtWXl/pub?gid=0&single=true&output=csv";

export function StreamEpisodeFinder() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: episodes,
    isLoading,
    error,
  } = useQuery<Episode[]>({
    queryKey: ["episodes"],
    queryFn: async () => {
      console.log('fetch csv')
      const response = await fetch(SHEET_URL);
      const csv = await response.text();
      const results = Papa.parse(csv, { header: true, skipEmptyLines: true });
      return (results.data as { [key: string]: string }[]).map((row) => ({
        date: row["date"],
        articleLink: row["covered_link"],
        streamTitle: row["stream_name"],
        streamLink: row["stream_link"],
      }));
    },
  });

  const fuse_config = {
    keys: ["streamTitle", "articleLink", "date"],
    threshold: 0.2,
    ignoreLocation: true,
  };
  let searchResults: Episode[] = [];
  let init_round = true;
  if (searchTerm) {
    searchTerm
      .trim()
      .split(" ")
      .forEach((term) => {
        // console.log(`term: ${term}`);
        if (init_round) {
          // Time the fuse search
          let start = performance.now();
          let fuse = new Fuse(episodes || [], fuse_config);
          let end = performance.now();
          console.log(`Fuse init time: ${end - start} ms`);
          searchResults = fuse.search(term).map((result) => result.item);
          init_round = false;
        } else {
          let fuse = new Fuse(searchResults, fuse_config);
          searchResults = fuse.search(term).map((result) => result.item);
        }
      });
  } else {
    searchResults = episodes || [];
  }
  // console.log(searchResults);
  return (
    <div className="container mx-auto p-4 w-100">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Stream Episode Finder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search episodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-center">Loading episodes...</p>}
      {error && (
        <p className="text-center text-red-500">
          Error loading episodes. Please try again.
        </p>
      )}

      {searchResults && searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((episode, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  {episode.streamTitle}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {moment(episode.date, "DD/MM/YYYY").format("MMMM D, YYYY")}
                </p>
                <div className="flex space-x-2">
                  <a
                    href={episode.streamLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-red-500 hover:underline"
                  >
                    <Youtube className="h-4 w-4 mr-1" />
                    Stream
                  </a>
                  <a
                    href={episode.articleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-500 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {episode.articleLink}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center">No episodes found.</p>
      )}
    </div>
  );
}
