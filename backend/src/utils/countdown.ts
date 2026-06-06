/**
 * Countdown Calculation Utility
 * Handles 60-day claim period logic
 */

import { CLAIM_PERIOD_DAYS, COUNTDOWN_STATUS } from "../constants/index.js";
import type { ICountdownInfo } from "../interfaces/index.js";

export function getCountdownInfo(dateReported: Date): ICountdownInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reportedDate = new Date(dateReported);
  reportedDate.setHours(0, 0, 0, 0);

  const daysElapsed = Math.max(
    0,
    Math.floor((today.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const daysRemaining = Math.max(0, CLAIM_PERIOD_DAYS - daysElapsed);
  const isExpired = daysElapsed >= CLAIM_PERIOD_DAYS;

  let countdownStatus: ICountdownInfo["countdownStatus"];

  if (isExpired) {
    countdownStatus = COUNTDOWN_STATUS.EXPIRED;
  } else if (daysRemaining <= 10) {
    countdownStatus = COUNTDOWN_STATUS.LAST_10;
  } else if (daysRemaining <= 30) {
    countdownStatus = COUNTDOWN_STATUS.EXPIRING;
  } else {
    countdownStatus = COUNTDOWN_STATUS.ACTIVE;
  }

  return {
    daysRemaining,
    daysElapsed,
    isExpired,
    countdownStatus,
  };
}

export function isItemExpired(dateReported: Date): boolean {
  const { isExpired } = getCountdownInfo(dateReported);
  return isExpired;
}

export function getExpiredItems<T extends { dateLost?: Date; dateFound?: Date }>(
  items: T[]
): T[] {
  return items.filter((item) => {
    const dateToCheck = item.dateLost || item.dateFound;
    return dateToCheck && isItemExpired(dateToCheck);
  });
}
