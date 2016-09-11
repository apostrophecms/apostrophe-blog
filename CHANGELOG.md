### 2.0.1

Fixed a significant performance bug. The blog widget was fetching *every* widget rather than just those with the appropriate IDs. The set of results was then being winnowed by the algorithm for handling many widgets with one query, but not before considerable resources were spent fetching areas for those blog posts, etc.
