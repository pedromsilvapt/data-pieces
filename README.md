# Pieces

> Three efficient data structures to save and traverse indexed chunks of information (like torrent blocks or HLS segments)

# Installation
```shell
npm install --save data-pieces
```

# Description
Say you are building a video player that downloads the video in smaller fixed-size chunks, and need to be able to insert/remove those chunks
in an efficient data structure to keep track of what pieces you have and what pieces you don't.

This module provides three options: `PiecesMap`, `PiecesSet` and `PiecesTable`.

**PiecesMap** uses a simple array to store each item, meaning that insertion/deletion as well as retrieval are all constant time O(1) operations. However, finding the segments of pieces/empty pieces means traversing the whole array, resulting in O(n) time (`n = number of pieces`). Recomended when the pieces are fragmented (not sequential) or when insert/remove speeds are more important than querying for empty spaces. Also, can store unique information associated with each piece index.

**PiecesSet** uses a balanced binary search tree and internally stores each leaf as an `IRange { start : number, end : number }`. So, any contiguous leafs are merged into a single leaf. If most pieces are obtained sequentially over time, or in big contiguous chunks, this will result in very little memory consumption and fast traversal.

**PiecesTable** is composed of an instance of both `PiecesMap` and `PiecesSet`, making sure to maintain both synchronized, and using the map to store associated information to each piece, as well as the set to query for grouped ranges of filled/empty spaces.

# Usage
> **Note** This project comes with typescript definition files right out of the box. Type away!
```typescript
import { PiecesSet, PiecesMap, PiecesTable } from 'data-pieces';

const set = new PiecesSet( 5 );

set.add( 1 );
set.add( 2 );
set.add( 3 );
set.add( 5 );
set.delete( 3 );

set.available(); // Iterator { start: 1, end: 2 }, { start: 5, end: 5 }
set.empty(); // Iterator { start: 0, end: 0 }, { start: 3, end: 4 }

const map = new PiecesMap( 5 );

map.set( 1, 'first' );
map.add( 2, 'first' );
map.add( 3, 'first' );
map.add( 5, 'second' );
map.delete( 3 );

map.available(); // Iterator { start: 1, end: 2 }, { start: 5, end: 5 }
map.empty(); // Iterator { start: 0, end: 0 }, { start: 3, end: 4 }

map.get( 5 ) // 'second'
```

Aditionally, the data structures also support waiting for a piece to be retrieved. Calling the `acquire( index : number )` method
will return a promise that will only be resolved once that piece is added to the map/set/table (or resolve immediately if the piece is already present).
```typescript
import { PiecesTable } from 'data-pieces';

const table = new PiecesTable( 10 );

table.acquire( 1 ).then( () => console.log( 'Piece one available.' ) );

// And sometime later in the application
table.add( 1, 'value' );
// Will resolve the promise and trigger the console log above
```
