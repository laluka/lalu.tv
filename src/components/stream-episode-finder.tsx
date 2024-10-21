'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'
import Fuse from 'fuse.js'
import { format } from 'date-fns'
import moment from 'moment'
import { Search, ExternalLink, Youtube } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Episode = {
  date: string
  articleLink: string
  streamTitle: string
  streamLink: string
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQl0fYlik6fvtVqSZ0MrFS9LugV8izIwbc9GPSAcOELk4tyhixYMT1K5OpJX4LZgHHE9s6O6ZwCtWXl/pub?gid=0&single=true&output=csv'

export function StreamEpisodeFinderComponent() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: episodes, isLoading, error } = useQuery<Episode[]>({
    queryKey: ['episodes'],
    queryFn: async () => {
      const response = await fetch(SHEET_URL)
      const csv = await response.text()
      const results = Papa.parse(csv, { header: true, skipEmptyLines: true })
      return results.data.slice(1).map((row: { [key: string]: string }) => ({
        date: row["date"],
        articleLink: row["covered_link"],
        streamTitle: row["stream_name"],
        streamLink: row["stream_link"],
      }))
    },
  })

  const fuse = new Fuse(episodes || [], {
    keys: ['streamTitle', 'articleLink', 'date'],
    threshold: 0.4,
  })

  const searchResults = searchTerm
    ? fuse.search(searchTerm).map(result => result.item)
    : episodes

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* <h1 className="text-3xl font-bold mb-6">Stream Episode Finder</h1> */}
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search for stream episodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      {isLoading && <p className="text-center">Loading episodes...</p>}
      {error && <p className="text-center text-red-500">Error loading episodes. Please try again later.</p>}

      {searchResults && (
        <div className="grid gap-4 md:grid-cols-2">
          {searchResults.map((episode, index) => (
            <Card key={index} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{episode.streamTitle}</CardTitle>
                <CardDescription>{moment(episode.date, "DD/MM/YYYY").format("YYYY/MM/DD")}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-2">{episode.articleLink}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <a href={episode.articleLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2" size={16} />
                    Article
                  </a>
                </Button>
                <Button asChild>
                  <a href={episode.streamLink} target="_blank" rel="noopener noreferrer">
                    <Youtube className="mr-2" size={16} />
                    Watch Stream
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}