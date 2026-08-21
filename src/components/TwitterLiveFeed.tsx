import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Sparkles, 
  ExternalLink, 
  Heart, 
  Repeat2, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  RefreshCw, 
  Filter, 
  Flame, 
  Zap,
  ArrowRight,
  Clock,
  Send,
  Plus
} from 'lucide-react';
import { TweetFeedItem } from '../types/tweet';
import { INITIAL_TWEETS } from '../data/initialTweets';
import { useTokenStore } from '../data/tokenStore';
import { Token } from '../types/token';

interface TwitterLiveFeedProps {
  onNavigate: (page: string, param?: string) => void;
  className?: string;
  isCompact?: boolean;
}

export const TwitterLiveFeed: React.FC<TwitterLiveFeedProps> = ({
  onNavigate,
  className = '',
  isCompact = false,
}) => {
  const { setClonedTokenDraft } = useTokenStore();
  const [tweets, setTweets] = useState<TweetFeedItem[]>(() => {
    try {
      const saved = localStorage.getItem('swagpad_live_tweets');
      return saved ? JSON.parse(saved) : INITIAL_TWEETS;
    } catch {
      return INITIAL_TWEETS;
    }
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'viral' | 'elon' | 'news' | 'solana'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newTweetAlert, setNewTweetAlert] = useState<string | null>(null);

  // Periodic simulation of incoming live tweets from timeline
  useEffect(() => {
    const interval = setInterval(() => {
      const liveSamples: TweetFeedItem[] = [
        {
          id: `tweet-live-${Date.now()}`,
          authorName: 'Elon Musk',
          authorHandle: 'elonmusk',
          authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          authorRole: 'Tech Visionary & X Owner',
          content: `In retrospect, it was inevitable. The cyber meme fleet is deploying to quantum orbit. High resonance mode activated.`,
          timestamp: Date.now(),
          likes: Math.floor(Math.random() * 5000) + 1200,
          retweets: Math.floor(Math.random() * 2000) + 400,
          replies: Math.floor(Math.random() * 800) + 150,
          tweetUrl: 'https://x.com/elonmusk',
          memePotential: 'VIRAL',
          relatedCategory: 'meme',
          preset: {
            name: 'Quantum Cyber Fleet',
            symbol: 'CYBERFLEET',
            description: 'In retrospect it was inevitable. Quantum orbit resonance meme coin inspired by Elon live tweet.',
            suggestedImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
            initialBuySol: 0.5,
            tags: ['elon', 'cyber', 'fleet', 'inevitable'],
          },
        },
        {
          id: `tweet-live-${Date.now() + 1}`,
          authorName: 'Solana Floor News',
          authorHandle: 'SolanaFloor',
          authorAvatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80',
          isVerified: true,
          authorRole: 'Solana Ecosystem Daily',
          content: 'Massive surge in meme bundler launches! 4,500 new bonding curves deployed in the last hour as retail volume spikes.',
          timestamp: Date.now(),
          likes: Math.floor(Math.random() * 3000) + 800,
          retweets: Math.floor(Math.random() * 1200) + 300,
          replies: Math.floor(Math.random() * 400) + 80,
          tweetUrl: 'https://x.com/SolanaFloor',
          memePotential: 'HIGH',
          relatedCategory: 'defi',
          preset: {
            name: 'Meme Surge 4500',
            symbol: 'SURGE4500',
            description: '4500 bonding curves in 60 minutes. The ultimate velocity speedrun token for Solana floor runners.',
            suggestedImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80',
            initialBuySol: 0.4,
            tags: ['solana', 'surge', 'floor', 'volume'],
          },
        },
      ];

      const chosen = liveSamples[Math.floor(Math.random() * liveSamples.length)];
      setTweets((prev) => {
        const next = [chosen, ...prev.slice(0, 19)];
        try {
          localStorage.setItem('swagpad_live_tweets', JSON.stringify(next));
        } catch {}
        return next;
      });

      setNewTweetAlert(`New Tweet from @${chosen.authorHandle}: "${chosen.preset.name}"`);
      setTimeout(() => setNewTweetAlert(null), 4000);
    }, 45000); // New tweet every 45s

    return () => clearInterval(interval);
  }, []);

  const handleLaunchFromTweet = (tweet: TweetFeedItem) => {
    // Fill the draft into useTokenStore
    const draft: Partial<Token> = {
      name: tweet.preset.name,
      symbol: tweet.preset.symbol,
      description: tweet.preset.description,
      logoUrl: tweet.preset.suggestedImageUrl,
      category: tweet.relatedCategory,
      socials: {
        twitter: tweet.tweetUrl,
        website: `https://x.com/${tweet.authorHandle}`,
      },
    };

    setClonedTokenDraft(draft);
    onNavigate('launch');
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const filteredTweets = tweets.filter((t) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'viral') return t.memePotential === 'VIRAL' || t.memePotential === 'URGENT';
    if (selectedFilter === 'elon') return t.authorHandle.toLowerCase().includes('elon');
    if (selectedFilter === 'news') return t.authorRole.toLowerCase().includes('news') || t.authorRole.toLowerCase().includes('outlet');
    if (selectedFilter === 'solana') return t.authorHandle.toLowerCase().includes('sol') || t.content.toLowerCase().includes('solana');
    return true;
  });

  const formatTimeAgo = (time: number) => {
    const diff = Math.max(0, Date.now() - time);
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Live X (Twitter) Meme Radar
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Live tweets from influential crypto leaders, news & founders with instant 1-Click Pump Presets
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'viral', 'elon', 'solana', 'news'] as const).map((filterId) => (
            <button
              key={filterId}
              onClick={() => setSelectedFilter(filterId)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedFilter === filterId
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {filterId === 'all' ? 'All Tweets' : filterId}
            </button>
          ))}
          <button
            onClick={handleManualRefresh}
            title="Refresh feed"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* New Tweet Notification Alert Banner */}
      <AnimatePresence>
        {newTweetAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-900 font-semibold"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>{newTweetAlert}</span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
              Just In
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tweet Stream Grid / List */}
      <div className={`p-4 sm:p-5 divide-y divide-slate-100 ${isCompact ? 'max-h-[520px] overflow-y-auto' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTweets.map((tweet) => (
            <motion.div
              key={tweet.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Top: Author & Tag */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={tweet.authorAvatar}
                      alt={tweet.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {tweet.authorName}
                        </span>
                        {tweet.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>@{tweet.authorHandle}</span>
                        <span>•</span>
                        <span className="text-[11px] flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(tweet.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Viral Potential Badge */}
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      tweet.memePotential === 'VIRAL'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : tweet.memePotential === 'URGENT'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {tweet.memePotential} SPEED
                  </span>
                </div>

                {/* Tweet Text */}
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal mb-3 bg-white p-3 rounded-lg border border-slate-100">
                  "{tweet.content}"
                </p>

                {/* Tweet Metrics */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3.5 px-1">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {(tweet.likes / 1000).toFixed(1)}k
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="w-3.5 h-3.5 text-emerald-600" />
                    {(tweet.retweets / 1000).toFixed(1)}k
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    {tweet.replies}
                  </span>
                  <a
                    href={tweet.tweetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1"
                  >
                    View on X <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Bottom: Generated Preset & Launch Button */}
              <div className="pt-3 border-t border-slate-200/80 bg-emerald-50/50 -mx-4 -mb-4 p-3.5 rounded-b-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={tweet.preset.suggestedImageUrl}
                      alt={tweet.preset.name}
                      className="w-8 h-8 rounded-lg object-cover border border-emerald-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {tweet.preset.name}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1 rounded">
                          ${tweet.preset.symbol}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Preset ready • {tweet.preset.tags.map((t) => `#${t}`).join(' ')}
                      </div>
                    </div>
                  </div>

                  {/* Primary 1-Click Launch Button */}
                  <button
                    type="button"
                    onClick={() => handleLaunchFromTweet(tweet)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Launch Meme</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
