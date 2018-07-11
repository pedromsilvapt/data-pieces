import { Future } from '@pedromsilva/data-future';
import { RBTree } from './RBTree';

export interface IRange {
    start : number;
    end : number;
}

export class Range implements IRange {
    start : number;
    end : number;

    constructor ( start : IRange );
    constructor ( start : number, end : number );
    constructor ( start : number | IRange, end ?: number ) {
        if ( typeof start === 'object' ) {
            end = start.end;
            start = start.start;
        }

        this.start = start;
        this.end = end;
    }

    get size () : number {
        return this.end - this.start;
    }

    get empty () : boolean {
        return this.end <= this.start;
    }

    union ( range : IRange ) {
        return new Range(
            Math.min( this.start, range.start ),
            Math.max( this.end, range.end )
        );
    }

    intersect ( range : IRange ) {
        return new Range(
            Math.max( this.start, range.start ),
            Math.min( this.end, range.end )
        );
    }

    static overlap ( a : IRange, b : IRange ) : boolean {
        if ( a.start <= b.start && a.end >= b.start ) {
            return true;
        }

        if ( a.start <= b.end && a.end >= b.end ) {
            return true;
        }

        if ( b.start <= a.start && b.end >= a.start ) {
            return true;
        }

        if ( b.start <= a.end && b.end >= a.end ) {
            return true;
        }

        return false;
    }

    // `ranges` should be a sorted non-overlapping array of ranges
    static * invert ( ranges : IterableIterator<IRange>, boundaries : IRange ) : IterableIterator<IRange> {
        for ( let range of ranges ) {
            if ( boundaries.start < range.start ) {
                yield { start: boundaries.start, end: range.start - 1 };

                boundaries.start = range.end + 1;
            }
        }

        if ( boundaries.end > boundaries.start ) {
            yield { start: boundaries.start, end: boundaries.end };
        }
    }

    static size ( ranges : IterableIterator<IRange> ) : number {
        let length = 0;

        for ( let range of ranges ) {
            length += range.end - range.start;
        }

        return length;
    }
}

export abstract class WatchablePiecesMap {
    protected watchers : Map<number, Future<void>> = new Map();

    abstract has ( index : number ) : boolean;

    protected notify ( index : number ) : void {
        const watcher = this.watchers.get( index );
    
        if ( watcher != null ) {
            this.watchers.delete( index );

            watcher.resolve();
        }
    }

    acquire ( index : number ) : Promise<void> {
        if ( this.has( index ) ) {
            return Promise.resolve( null );
        }

        let future = this.watchers.get( index );

        if ( future == null ) {
            this.watchers.set( index, future = new Future() );
        }

        return future.promise;
    }
}

export class PiecesMap<T> extends WatchablePiecesMap {
    missing : number = 0;

    boundaries : Range;

    protected _size : number = 0;

    protected pieces : T[];

    constructor ( size : number ) {
        super();
        
        this.size = size;
        this.missing = size;

        this.pieces = [];
    }

    get size () : number {
        return this._size;
    }

    set size ( value : number ) {
        const diff = value - this._size

        // If diff > 0 then increase missing
        // If diff < 0 then get all pieces available between value and _size and
            // delete them (shrink array if necessary)
            // remove them from missing
        if ( diff > 0 ) {
            this.missing += diff;
        } else if ( diff < 0 ) {
            const end = this.pieces.length;

            if ( end > value ) {
                this.missing -= Range.size( this.available( { start: value, end: end } ) );
    
                this.pieces.splice( value, end - value );
            }
        }
        
        if ( diff != 0 ) {
            this._size = value;
    
            this.boundaries = new Range( 0, value );
        }
    }

    protected ensurePiecesBuffer ( index : number ) {
        while ( this.pieces.length <= index ) {
            this.pieces.push( null );
        }
    }

    public get ( index : number ) : T {
        if ( this.pieces.length <= index ) {
            return null;
        }

        return this.pieces[ index ];
    }

    public set ( index : number, value : T ) {
        this.ensurePiecesBuffer( index );

        if ( this.pieces[ index ] == null && value !== null ) {
            this.missing--;
        } else if ( this.pieces[ index ] != null && value === null ) {
            this.missing++;
        }

        this.pieces[ index ] = value;

        if ( value != null ) {
            this.notify( index );
        }
    }

    public has ( index : number ) : boolean {
        return this.pieces.length > index && this.pieces[ index ] !== null;
    }

    public delete ( index : number ) {
        this.set( index, null );
    }

    public clear () {
        this.missing = this.size;
        this.pieces = [];
    }

    * available ( limit ?: IRange ) : IterableIterator<IRange> {
        limit = this.boundaries.intersect( limit || this.boundaries );

        let current = limit.start;

        let range : IRange = null;

        while ( current < limit.end ) {
            if ( this.has( current ) ) {
                if ( !range ) {
                    range = { start: current, end: current };
                } else {
                    range.end++;
                }
            } else if ( range != null ) {
                yield range;

                range = null;
            }

            current++;
        }

        if ( range != null ) {
            yield range;
        }
    }

    empty ( limit ?: IRange ) : IterableIterator<IRange> {
        return Range.invert( this.available( limit ), this.boundaries.intersect( limit || this.boundaries ) );
    }
}

export class PiecesSet extends WatchablePiecesMap {
    constructor ( size : number ) {
        super();

        this.size = size;
        this.missing = size;
    }

    size: number;

    missing: number;

    protected tree : RBTree<IRange> = new RBTree( ( a, b ) => Range.overlap( a, b ) ? 0 : a.start - b.start );
    
    protected tmpRange : Range = new Range( 0, 0 );

    add ( index : number ) : void {
        this.tmpRange.start = index;
        this.tmpRange.end = index;

        const match = this.tree.find( this.tmpRange );

        if ( !match ) {
            const [ lower, upper ] = this.tree.closest( this.tmpRange );
    
            if ( lower && upper && lower.value.end == index - 1 && upper.value.start == index + 1 ) {
                const end = upper.value.end;
                
                this.tree.delete( upper.value );
                
                lower.value.end = end;
            } else if ( lower && lower.value.end == index - 1 ) {
                lower.value.end = index;
            } else if ( upper && upper.value.start == index + 1 ) {
                upper.value.start = index;
            } else if ( ( !lower || lower.value.end < index  - 1 ) && ( !upper || upper.value.start > index + 1 ) ) {
                this.tree.insert( { start: index, end: index } );
            }

            this.missing--;
                
            this.notify( index );
        }
    }

    has ( index : number ) : boolean {
        this.tmpRange.start = index;
        this.tmpRange.end = index;

        const [ lower, upper ] = this.tree.closest( this.tmpRange );

        const inLower = lower && lower.value.start <= index && lower.value.end >= index;
        const inUpper = upper && upper.value.start <= index && upper.value.end >= index;

        return inLower || inUpper;
    }

    delete ( index : number ) : void {
        this.tmpRange.start = index;
        this.tmpRange.end = index;

        const match = this.tree.find( this.tmpRange );

        if ( match ) {
            this.missing++;

            if ( match.value.start == index && match.value.end == index ) {
                this.tree.delete( match.value );
            } else if ( match.value.start == index ) {
                match.value.start++;
            } else if ( match.value.end == index ) {
                match.value.end--;
            } else {
                const split = { start: index + 1, end: match.value.end };

                match.value.end = index - 1;

                this.tree.insert( split );
            }
        }
    }

    clear () : void {
        this.tree.clear();

        this.missing = this.size;
    }

    groupOf ( index : number ) : [ boolean, IRange ] {
        this.tmpRange.start = index;
        this.tmpRange.end = index;

        const match = this.tree.find( this.tmpRange );

        if ( match ) {
            return [ true, match.value ];
        } else {
            const [ lower, upper ] = this.tree.closest( this.tmpRange );

            const range = { start: 0, end: this.size };

            if ( lower ) {
                range.start = lower.value.end + 1;
            }

            if ( upper ) {
                range.end = upper.value.start - 1;
            }

            return [ false, range ];
        }
    }

    * available ( limit ?: IRange ) : IterableIterator<IRange> {
        limit = limit || { start: 0, end: this.size };

        const start = { start: limit.start, end: limit.start };
        const end = { start: limit.end, end: limit.end };
        
        for ( let node of this.tree.between( start, end ) ) {
            yield { 
                start: Math.max( limit.start, node.value.start ), 
                end: Math.min( limit.end, node.value.end ) 
            };
        }
    }

    empty ( limit ?: IRange ) : IterableIterator<IRange> {
        const boundaries = new Range( 0, this.size );

        return Range.invert( this.available(), boundaries.intersect( limit || boundaries ) );
    }
}

export class PiecesTable<T> {
    protected piecesMap : PiecesMap<T>;
    protected piecesSet : PiecesSet;

    constructor ( size : number ) {
        this.piecesMap = new PiecesMap( size );
        this.piecesSet = new PiecesSet( size );
    }

    get size () : number {
        return this.piecesMap.size;
    }

    set size ( value : number ) {
        this.piecesMap.size = value;
        this.piecesSet.size = value;
    }

    get missing () : number {
        return this.piecesMap.missing;
    }

    get ( index : number ) : T {
        return this.piecesMap.get( index );
    }

    set ( index : number, value : T ) {
        this.piecesSet.add( index );
        this.piecesMap.set( index, value );
    }

    has ( index : number ) : boolean {
        return this.piecesMap.has( index );
    }

    delete ( index : number ) {
        this.piecesSet.delete( index );
        this.piecesMap.delete( index );
    }

    clear () {
        this.piecesSet.clear();
        this.piecesMap.clear();
    }

    acquire ( index : number ) : Promise<void> {
        return this.piecesMap.acquire( index );
    }

    groupOf ( index : number ) : [ boolean, IRange ] {
        return this.piecesSet.groupOf( index );
    }

    available ( limit ?: IRange ) : IterableIterator<IRange> {
        return this.piecesSet.available( limit );
    }

    empty ( limit ?: IRange ) : IterableIterator<IRange> {
        return this.piecesSet.empty( limit );
    }
}