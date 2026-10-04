import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Opens a route to requests without a session token (SessionAuthGuard still reads one if sent). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
