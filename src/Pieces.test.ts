import test from 'tape';
import { PiecesSet, Range } from './Pieces';

test( 'Range', t => {
    t.test( '#overlap', t => {
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 0, 2 ) ), true );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 0, 6 ) ), true );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 1, 6 ) ), true );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 1, 2 ) ), true );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 2, 2 ) ), true );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 0, 0 ) ), true );

        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 3, 3 ) ), false );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 3, 6 ) ), false );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( -2, -1 ) ), false );
        t.equals( Range.overlap( new Range( 0, 2 ), new Range( 3, 4 ) ), false );

        t.end();
    } );

    t.test( '#intersect', t => {
        t.deepEquals( new Range( 0, 2 ).intersect( new Range( 1, 3 ) ), new Range( 1, 2 ) );
        t.deepEquals( new Range( 0, 2 ).intersect( new Range( 0, 6 ) ), new Range( 0, 2 ) );
        t.deepEquals( new Range( 0, 2 ).intersect( new Range( -6, 6 ) ), new Range( 0, 2 ) );
        t.deepEquals( new Range( 0, 2 ).intersect( new Range( -6, 1 ) ), new Range( 0, 1 ) );
        t.deepEquals( new Range( 0, 2 ).intersect( new Range( 3, 6 ) ), null );

        t.end();
    } );
} );

test( 'PiecesSet', t => {
    t.test( '#add', t => {
        t.test( 'out of order insertion', t => {
            const set = new PiecesSet( 6 );

            set.add( 4 );
            set.add( 0 );
            set.add( 1 );
            set.add( 5 );
            set.add( 2 );
            set.add( 3 );

            t.deepEquals( Array.from( set ), [ { start: 0, end: 5 } ] );

            t.end();
        } );

        t.test( 'out of order insertion with empty spaces', t => {
            const set = new PiecesSet( 6 );

            set.add( 0 );
            set.add( 2 );
            set.add( 5 );
            set.add( 3 );

            t.deepEquals( Array.from( set ), [ { start: 0, end: 0 }, { start: 2, end: 3 }, { start: 5, end: 5 } ] );

            t.end();
        } );
    } );

    t.test( '#has', t => {
        t.test( 'no empty spaces', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 6; i++ ) {
                t.equals( set.has( i ), false );
            }

            for ( let i = 0; i < 6; i++ ) set.add( i );

            for ( let i = 0; i < 6; i++ ) {
                t.equals( set.has( i ), true );
            }

            t.end();
        } );

        t.test( 'empty space at the beginning', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 6; i++ ) {
                t.equals( set.has( i ), false );
            }

            for ( let i = 2; i < 6; i++ ) set.add( i );

            for ( let i = 0; i < 2; i++ ) {
                t.equals( set.has( i ), false );
            }
            for ( let i = 2; i < 6; i++ ) {
                t.equals( set.has( i ), true );
            }

            t.end();
        } );
    } );

    t.test( '#available', t => {
        t.test( 'no empty spaces', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 6; i++ ) set.add( i );

            const available = Array.from( set.available() );

            t.deepEquals( available, [ { start: 0, end: 5 } ] );
            t.end();
        } );

        t.test( 'empty space at the beginning', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 2; i < 6; i++ ) set.add( i );

            const available = Array.from( set.available() );

            t.deepEquals( available, [ { start: 2, end: 5 } ] );
            t.end();
        } );

        t.test( 'empty space in the middle', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 3; i++ ) set.add( i );

            for ( let i = 4; i < 6; i++ ) set.add( i );

            const available = Array.from( set.available() );

            t.deepEquals( available, [ { start: 0, end: 2 }, { start: 4, end: 5 } ] );
            t.end();
        } );

        t.test( 'multiple empty spaces', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 1; i < 2; i++ ) set.add( i );

            for ( let i = 4; i < 5; i++ ) set.add( i );

            const available = Array.from( set.available() );

            t.deepEquals( available, [ { start: 1, end: 1 }, { start: 4, end: 4 } ] );
            t.end();
        } );

        t.test( 'multiple empty spaces inside sub-range', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 1; i < 2; i++ ) set.add( i );

            for ( let i = 3; i < 5; i++ ) set.add( i );

            let available = Array.from( set.available( { start: 1, end: 5 } ) );
            t.deepEquals( available, [ { start: 1, end: 1 }, { start: 3, end: 4 } ] );

            available = Array.from( set.available( { start: 0, end: 3 } ) );
            t.deepEquals( available, [ { start: 1, end: 1 }, { start: 3, end: 3 } ] );

            available = Array.from( set.available( { start: 1, end: 4 } ) );
            t.deepEquals( available, [ { start: 1, end: 1 }, { start: 3, end: 4 } ] );

            available = Array.from( set.available( { start: 2, end: 5 } ) );
            t.deepEquals( available, [ { start: 3, end: 4 } ] );

            available = Array.from( set.available( { start: 2, end: 3 } ) );
            t.deepEquals( available, [ { start: 3, end: 3 } ] );

            available = Array.from( set.available( { start: -1, end: 6 } ) );
            t.deepEquals( available, [ { start: 1, end: 1 }, { start: 3, end: 4 } ] );
            t.end();
        } );
    } );

    t.test( '#empty', t => {
        t.test( 'no empty spaces', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 6; i++ ) set.add( i );

            const nextEmpty = set.empty().next();

            t.equals( nextEmpty.done, true, 'done should be true' );
            t.end();
        } );

        t.test( 'empty space at the beginning', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 2; i < 6; i++ ) set.add( i );

            const nextEmpty = set.empty().next();

            t.equals( nextEmpty.done, false, 'done should be false' );
            t.equals( nextEmpty.value.start, 0, 'start should be 0' );
            t.equals( nextEmpty.value.end, 1, 'end should be 2' );
            t.end();
        } );

        t.test( 'empty space in the middle', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 3; i++ ) set.add( i );

            for ( let i = 4; i < 6; i++ ) set.add( i );

            const emptyRanges = Array.from( set.empty() );

            t.deepEquals( emptyRanges, [ { start: 3, end: 3 } ] );
            t.end();
        } );

        t.test( 'multiple empty spaces', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 1; i < 2; i++ ) set.add( i );

            for ( let i = 4; i < 5; i++ ) set.add( i );

            const empty = Array.from( set.empty() );

            t.deepEquals( empty, [ { start: 0, end: 0 }, { start: 2, end: 3 }, { start: 5, end: 5 } ] );
            t.end();
        } );

        t.test( 'multiple empty spaces inside sub-range', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 1; i < 2; i++ ) set.add( i );

            for ( let i = 4; i < 5; i++ ) set.add( i );

            let empty = Array.from( set.empty( { start: 1, end: 5 } ) );
            t.deepEquals( empty, [ { start: 2, end: 3 }, { start: 5, end: 5 } ] );

            empty = Array.from( set.empty( { start: 0, end: 2 } ) );
            t.deepEquals( empty, [ { start: 0, end: 0 }, { start: 2, end: 2 } ] );

            empty = Array.from( set.empty( { start: 1, end: 4 } ) );
            t.deepEquals( empty, [ { start: 2, end: 3 } ] );

            empty = Array.from( set.empty( { start: 1, end: 5 } ) );
            t.deepEquals( empty, [ { start: 2, end: 3 }, { start: 5, end: 5 } ] );

            empty = Array.from( set.empty( { start: -1, end: 6 } ) );
            t.deepEquals( empty, [ { start: 0, end: 0 }, { start: 2, end: 3 }, { start: 5, end: 5 } ] );
            t.end();
        } );
    } );

    t.test( '#import', t => {
        t.test( 'empty', t => {
            const set = new PiecesSet( 6 );

            set.import( set.export() );

            t.equals( set.missing, 6, 'missing should be all pieces' );
            t.equals( Array.from( set ).length, 0, 'set should be empty' );
            t.end();
        } );

        t.test( 'full', t => {
            const set = new PiecesSet( 6 );

            for ( let i = 0; i < 6; i++ ) set.add( i );

            const exported = set.export();

            set.clear();

            set.import( exported );

            const segments = Array.from( set );

            t.equals( set.missing, 0, 'missing should be all pieces' );
            t.equals( segments.length, 1, 'set should be empty' );
            t.end();
        } );

        t.test( 'partial', t => {
            const set = new PiecesSet( 6 );

            set.add( 0 );
            set.add( 2 );
            set.add( 3 );
            set.add( 5 );

            const exported = set.export();

            set.clear();

            set.import( exported );

            const segments = Array.from( set );

            t.equals( set.missing, 2, 'missing should be all pieces' );
            t.equals( segments.length, 3, 'set should be empty' );
            t.end();
        } );
    } );
} );
