"""
[AI] Market Hours - US equity market open/close and holiday checks.
Used to enforce trading only when market is open (9:30 AM - 4:00 PM ET, Mon-Fri, excluding holidays).
"""

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

# US Eastern timezone
ET = ZoneInfo("America/New_York")

# Regular session: 9:30 - 16:00 ET
MARKET_OPEN_TIME = time(9, 30)
MARKET_CLOSE_TIME = time(16, 0)

# Approximate NYSE holidays (year -> set of (month, day)); add more as needed
NYSE_HOLIDAYS = {
    2024: {(1, 1), (1, 15), (2, 19), (3, 29), (5, 27), (6, 19), (7, 4), (9, 2), (11, 28), (12, 25)},
    2025: {(1, 1), (1, 20), (2, 17), (4, 18), (5, 26), (6, 19), (7, 4), (9, 1), (11, 27), (12, 25)},
    2026: {(1, 1), (1, 19), (2, 16), (4, 3), (5, 25), (6, 19), (7, 3), (9, 7), (11, 26), (12, 25)},
}


def _now_et():
    """Current datetime in US Eastern."""
    return datetime.now(ET)


def _is_weekday(dt):
    """True if Monday (0) through Friday (4)."""
    return dt.weekday() < 5


def _is_holiday(dt):
    """True if date is a NYSE holiday."""
    year = dt.year
    if year not in NYSE_HOLIDAYS:
        # Extend with same set for unknown years (approximate)
        base = 2025 if year >= 2025 else 2024
        year = base
    return (dt.month, dt.day) in NYSE_HOLIDAYS.get(year, set())


def is_market_open():
    """
    Check if US equity market is currently open (regular session, weekday, not holiday).
    Returns:
        bool: True if market is open.
    """
    now = _now_et()
    if not _is_weekday(now):
        return False
    if _is_holiday(now):
        return False
    t = now.timetz() if hasattr(now, 'timetz') else now.time()
    # Compare as time (no tz on time objects)
    open_dt = datetime.combine(now.date(), MARKET_OPEN_TIME, tzinfo=ET)
    close_dt = datetime.combine(now.date(), MARKET_CLOSE_TIME, tzinfo=ET)
    return open_dt <= now <= close_dt


def get_market_status():
    """
    Get current market status and next open/close for display.
    Returns:
        dict: open (bool), nextOpen (ISO str or None), nextClose (ISO str or None), message (str).
    """
    now = _now_et()
    open_today = datetime.combine(now.date(), MARKET_OPEN_TIME, tzinfo=ET)
    close_today = datetime.combine(now.date(), MARKET_CLOSE_TIME, tzinfo=ET)

    next_open = None
    next_close = None

    if _is_holiday(now) or not _is_weekday(now):
        # Next open: next weekday that is not a holiday, at 9:30
        d = now.date()
        for _ in range(8):
            d += timedelta(days=1)
            nd = datetime.combine(d, MARKET_OPEN_TIME, tzinfo=ET)
            if _is_weekday(nd) and not _is_holiday(nd):
                next_open = nd.isoformat()
                next_close = datetime.combine(d, MARKET_CLOSE_TIME, tzinfo=ET).isoformat()
                break
    elif now < open_today:
        next_open = open_today.isoformat()
        next_close = close_today.isoformat()
    elif now <= close_today:
        next_close = close_today.isoformat()
        # Next open is tomorrow (or next trading day)
        d = now.date()
        for _ in range(8):
            d += timedelta(days=1)
            nd = datetime.combine(d, MARKET_OPEN_TIME, tzinfo=ET)
            if _is_weekday(nd) and not _is_holiday(nd):
                next_open = nd.isoformat()
                break
    else:
        # After close today
        d = now.date()
        for _ in range(8):
            d += timedelta(days=1)
            nd = datetime.combine(d, MARKET_OPEN_TIME, tzinfo=ET)
            if _is_weekday(nd) and not _is_holiday(nd):
                next_open = nd.isoformat()
                next_close = datetime.combine(d, MARKET_CLOSE_TIME, tzinfo=ET).isoformat()
                break

    message = "Market Open" if is_market_open() else "Market Closed"
    return {
        "open": is_market_open(),
        "nextOpen": next_open,
        "nextClose": next_close,
        "message": message,
    }
