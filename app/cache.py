from functools import lru_cache
from typing import Any, Optional, Dict, List
import time
from datetime import datetime, timedelta
from collections import OrderedDict
import threading

class CacheEntry:
    def __init__(self, value: Any, expiry: Optional[datetime] = None):
        self.value = value
        self.expiry = expiry
        self.last_accessed = datetime.utcnow()
        self.access_count = 0

    def is_expired(self) -> bool:
        if self.expiry is None:
            return False
        return datetime.utcnow() > self.expiry

    def update_access(self):
        self.last_accessed = datetime.utcnow()
        self.access_count += 1

class InMemoryCache:
    def __init__(self, maxsize: int = 1000, cleanup_interval: int = 300):
        self._cache: OrderedDict = OrderedDict()
        self.maxsize = maxsize
        self.cleanup_interval = cleanup_interval
        self._lock = threading.Lock()
        self._last_cleanup = datetime.utcnow()
        self._stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0
        }

    def _cleanup_expired(self):
        """Remove expired entries and perform periodic cleanup"""
        now = datetime.utcnow()
        if (now - self._last_cleanup).total_seconds() < self.cleanup_interval:
            return

        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
                self._stats['evictions'] += 1

            self._last_cleanup = now

    def _evict_entries(self, num_to_evict: int = 1):
        """Evict entries based on LRU and access frequency"""
        if not self._cache:
            return

        # Sort entries by last accessed time and access count
        entries = list(self._cache.items())
        entries.sort(key=lambda x: (
            x[1].last_accessed,
            -x[1].access_count  # Negative because we want to keep frequently accessed items
        ))

        # Remove the oldest/least accessed entries
        for key, _ in entries[:num_to_evict]:
            del self._cache[key]
            self._stats['evictions'] += 1

    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache with access tracking"""
        self._cleanup_expired()

        with self._lock:
            if key not in self._cache:
                self._stats['misses'] += 1
                return None

            entry = self._cache[key]
            if entry.is_expired():
                del self._cache[key]
                self._stats['evictions'] += 1
                self._stats['misses'] += 1
                return None

            # Update access statistics
            entry.update_access()
            self._stats['hits'] += 1

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return entry.value

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Set a value in cache with automatic eviction if needed"""
        self._cleanup_expired()

        with self._lock:
            # If cache is full, evict entries
            if len(self._cache) >= self.maxsize:
                self._evict_entries()

            expiry = None
            if ttl_seconds is not None:
                expiry = datetime.utcnow() + timedelta(seconds=ttl_seconds)

            self._cache[key] = CacheEntry(value, expiry)

    def delete(self, key: str) -> None:
        """Delete a specific key from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]

    def clear(self) -> None:
        """Clear all entries from cache"""
        with self._lock:
            self._cache.clear()
            self._stats = {
                'hits': 0,
                'misses': 0,
                'evictions': 0
            }

    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return self._stats.copy()

    def get_size(self) -> int:
        """Get current cache size"""
        return len(self._cache)

# Create a global cache instance
cache = InMemoryCache()

# Decorator for caching function results
def cached(ttl_seconds: Optional[int] = None):
    def decorator(func):
        @lru_cache(maxsize=1000)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator 