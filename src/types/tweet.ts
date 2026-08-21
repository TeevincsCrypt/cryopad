export interface TweetMemePreset {
  name: string;
  symbol: string;
  description: string;
  suggestedImageUrl: string;
  initialBuySol?: number;
  tags: string[];
}

export interface TweetFeedItem {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  isVerified: boolean;
  authorRole: string; // e.g. 'Tech Visionary', 'Ethereum Founder', 'Solana Foundation', 'Crypto Influencer'
  content: string;
  timestamp: number; // Unix timestamp
  likes: number;
  retweets: number;
  replies: number;
  tweetUrl: string;
  memePotential: 'URGENT' | 'HIGH' | 'MEDIUM' | 'VIRAL';
  preset: TweetMemePreset;
  relatedCategory: 'meme' | 'ai' | 'defi' | 'utility';
}
