import React, { useState, useEffect, useCallback } from 'react';
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
  Search,
  Bot,
  Radio,
  Share2,
  AlertCircle
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
      const saved = localStorage.getItem('swagpad_live_tweets_v2');
      return saved ? JSON.parse(saved) : INITIAL_TWEETS;
    } catch {
      return INITIAL_TWEETS;
    }
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'viral' | 'elon' | 'solana' | 'news' | 'ai'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newTweetAlert, setNewTweetAlert] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [agentRouterActive, setAgentRouterActive] = useState(false);

  // Custom Tweet URL or Handle input state
  const [customInput, setCustomInput] = useState('');
  const [isScanningUrl, setIsScanningUrl] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  // Real-time backend fetch from /api/tweets/live
  const fetchLiveTweets = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/tweets/live');
      if (res.ok) {
        const data = await res.json();
        if (data.tweets && Array.isArray(data.tweets) && data.tweets.length > 0) {
          setTweets((prev) => {
            // Merge custom or newer tweets with fetched ones
            const existingUrls = new Set(data.tweets.map((t: TweetFeedItem) => t.tweetUrl));
            const customUserTweets = prev.filter((t) => t.source === 'url_parser' && !existingUrls.has(t.tweetUrl));
            const merged = [...customUserTweets, ...data.tweets];
            try {
              localStorage.setItem('swagpad_live_tweets_v2', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          setIsLiveConnected(true);
          if (data.agentRouterActive) {
            setAgentRouterActive(true);
          }
        }
      }
    } catch (err) {
      console.warn('Could not reach backend /api/tweets/live:', err);
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, []);

  // Initial load and periodic polling every 45s
  useEffect(() => {
    fetchLiveTweets(false);
    const interval = setInterval(() => {
      fetchLiveTweets(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchLiveTweets]);

  // Handle custom URL / handle parsing via /api/tweets/parse-url
  const handleScanCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setIsScanningUrl(true);
    setScanError(null);
    setScanSuccess(null);

    try {
      const res = await fetch('/api/tweets/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customInput.trim() }),
      });

      const data = await res.json();
      if (data.success && data.tweet) {
        const scannedTweet: TweetFeedItem = data.tweet;
        setTweets((prev) => {
          const updated = [scannedTweet, ...prev.filter((t) => t.tweetUrl !== scannedTweet.tweetUrl)];
          try {
            localStorage.setItem('swagpad_live_tweets_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        setScanSuccess(`Scanned @${scannedTweet.authorHandle}'s post! Preset "${scannedTweet.preset.name}" ($${scannedTweet.preset.symbol}) ready.`);
        setCustomInput('');
        setNewTweetAlert(`Scanned post from @${scannedTweet.authorHandle}: "${scannedTweet.preset.name}"`);
        setTimeout(() => {
          setScanSuccess(null);
          setNewTweetAlert(null);
        }, 5000);
      } else {
        setScanError(data.error || 'Failed to scan Twitter post. Please check the URL or handle.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Network error scanning Twitter post.');
    } finally {
      setIsScanningUrl(false);
    }
  };

  const handleLaunchFromTweet = (tweet: TweetFeedItem) => {
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

  const filteredTweets = tweets.filter((t) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'viral') return t.memePotential === 'VIRAL' || t.memePotential === 'URGENT';
    if (selectedFilter === 'elon') return t.authorHandle.toLowerCase().includes('elon') || t.content.toLowerCase().includes('elon');
    if (selectedFilter === 'solana') return t.authorHandle.toLowerCase().includes('sol') || t.content.toLowerCase().includes('solana') || t.authorHandle.toLowerCase().includes('aeyakovenko');
    if (selectedFilter === 'news') return t.authorRole.toLowerCase().includes('news') || t.authorRole.toLowerCase().includes('outlet') || t.authorHandle.toLowerCase().includes('coindesk');
    if (selectedFilter === 'ai') return t.relatedCategory === 'ai' || t.content.toLowerCase().includes('ai') || t.authorHandle.toLowerCase().includes('sama') || t.authorHandle.toLowerCase().includes('vitalik');
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
    <div id="live-twitter-radar-card" className={`bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden ${className}`}>
      
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
                <span className="flex h-2 w-2 relative" title="Real-time Stream Connected">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h2>
              {agentRouterActive && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Bot className="w-3 h-3" /> AgentRouter AI
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Live tweets from key crypto leaders & influencers with direct links & instant 1-Click Pump Presets
            </p>
          </div>
        </div>

        {/* Filter Pills & Manual Refresh */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'viral', 'elon', 'solana', 'news', 'ai'] as const).map((filterId) => (
            <button
              id={`filter-btn-${filterId}`}
              key={filterId}
              onClick={() => setSelectedFilter(filterId)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                selectedFilter === filterId
                  ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {filterId === 'all' ? 'All Tweets' : filterId}
            </button>
          ))}
          <button
            id="manual-refresh-feed-btn"
            onClick={() => fetchLiveTweets(true)}
            title="Refresh live X feed"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer ml-1 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="text-[11px] hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Real-time Custom URL / @Handle Scanner */}
      <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-b border-slate-200">
        <form onSubmit={handleScanCustomUrl} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="twitter-scanner-input"
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste any live X post URL (e.g. https://x.com/elonmusk/status/...) or @handle to scan & build meme"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>
          <button
            id="scan-tweet-btn"
            type="submit"
            disabled={isScanningUrl || !customInput.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
          >
            {isScanningUrl ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning X...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scan & Create Preset</span>
              </>
            )}
          </button>
        </form>

        {/* Scan feedback notices */}
        {scanSuccess && (
          <div className="mt-2 text-xs text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{scanSuccess}</span>
          </div>
        )}
        {scanError && (
          <div className="mt-2 text-xs text-rose-700 bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}
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
              Live Tweet
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tweet Stream Grid */}
      <div className={`p-4 sm:p-5 ${isCompact ? 'max-h-[540px] overflow-y-auto' : ''}`}>
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://unavatar.io/x/${tweet.authorHandle}`;
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {tweet.authorName}
                        </span>
                        {tweet.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white shrink-0" />
                        )}
                        {tweet.source === 'syndication_live' && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded uppercase">Live</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <a
                          href={`https://x.com/${tweet.authorHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 hover:underline"
                        >
                          @{tweet.authorHandle}
                        </a>
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
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal mb-3 bg-white p-3 rounded-lg border border-slate-100 select-text">
                  "{tweet.content}"
                </p>

                {/* Tweet Metrics & Verified Direct Link on X */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3.5 px-1">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {(tweet.likes >= 1000 ? (tweet.likes / 1000).toFixed(1) + 'k' : tweet.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="w-3.5 h-3.5 text-emerald-600" />
                    {(tweet.retweets >= 1000 ? (tweet.retweets / 1000).toFixed(1) + 'k' : tweet.retweets)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    {tweet.replies}
                  </span>
                  <a
                    id={`view-on-x-${tweet.id}`}
                    href={tweet.tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View post by @${tweet.authorHandle} on X`}
                    className="ml-auto text-[11px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    <span>View on X</span>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </a>
                </div>
              </div>

              {/* Bottom: Generated Preset & 1-Click Launch Button */}
              <div className="pt-3 border-t border-slate-200/80 bg-emerald-50/50 -mx-4 -mb-4 p-3.5 rounded-b-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
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
                        <span className="font-mono text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1 rounded shrink-0">
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
                    id={`launch-meme-btn-${tweet.id}`}
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
