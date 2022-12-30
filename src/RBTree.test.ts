import test from 'tape';
import { RBTree } from './RBTree';

test( 'RBTree', t => {
    t.test( '#insert', t => {
        const tree: RBTree<number> = new RBTree( ( a, b ) => a - b );

        tree.insert( 1 );
        tree.insert( 3 );
        tree.insert( 2 );
        tree.insert( 5 );

        t.deepEquals( Array.from( tree ), [ 1, 2, 3, 5 ] );
        t.deepEquals( tree.size, 4 );
        t.deepEquals( tree.depth, 3 );
        t.end();
    } );

    t.test( '#delete', t => {
        const tree: RBTree<number> = new RBTree( ( a, b ) => a - b );

        tree.insert( 1 );
        tree.insert( 3 );
        tree.insert( 2 );
        tree.insert( 5 );

        tree.delete( 2 );

        t.deepEquals( Array.from( tree ), [ 1, 3, 5 ] );
        t.deepEquals( tree.size, 3 );
        t.deepEquals( tree.depth, 2 );
        t.end();
    } );

    t.test( '#delete non existing value', t => {
        const tree: RBTree<number> = new RBTree( ( a, b ) => a - b );

        tree.insert( 1 );
        tree.insert( 3 );
        tree.insert( 2 );
        tree.insert( 5 );

        tree.delete( 6 );

        t.deepEquals( Array.from( tree ), [ 1, 2, 3, 5 ] );
        t.deepEquals( tree.size, 4 );
        t.deepEquals( tree.depth, 3 );
        t.end();
    } );

    t.test( '#between ranges of values', t => {
        const tree: RBTree<number> = new RBTree( ( a, b ) => a - b );

        tree.insert( 0 );
        tree.insert( 1 );
        tree.insert( 2 );
        tree.insert( 4 );
        tree.insert( 5 );

        t.deepEquals( Array.from( tree ), [ 0, 1, 2, 4, 5 ] );
        t.deepEquals( tree.size, 5 );
        t.deepEquals( Array.from( tree.between( 0, 5 ) ).map( node => node.value ), [ 0, 1, 2, 4, 5 ] );
        t.end();
    } );
} );
