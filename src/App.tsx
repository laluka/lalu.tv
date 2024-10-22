import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StreamEpisodeFinder } from '@/components/stream-episode-finder'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StreamEpisodeFinder />
    </QueryClientProvider>
  )
}

export default App