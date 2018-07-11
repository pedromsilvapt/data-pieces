import * as printTree from 'print-tree';

/*
 * Implementation inspired by http://www.eternallyconfuzzled.com/tuts/datastructures/jsw_tut_rbtree.aspx,
 * specifically the insert and delete methods.
 */

export interface Comparator<T> {
    ( a : T, b : T ) : number;
}

export enum RBColor {
    Red = 0,
    Black = 1
}

export class RBNode<T> {
    links : [ RBNode<T>, RBNode<T> ] = [ null, null ];

    value : T;
    
    parent ?: RBNode<T>;
    color : RBColor;

    get left () : RBNode<T> {
        return this.links[ 0 ];
    }

    get right () : RBNode<T> {
        return this.links[ 1 ];
    }
    
    set left ( value : RBNode<T> ) {
        this.links[ 0 ] = value;
    }

    set right ( value : RBNode<T> ) {
        this.links[ 1 ] = value;
    }

    get uncle () : RBNode<T> {
        if ( this.parent == null ) {
            return null;
        }

        return this.parent.sibling;
    }

    get sibling () : RBNode<T> {
        if ( this.parent == null ) {
            return null;
        }

        if ( this.parent.left == this ) {
            return this.parent.right;
        } else {
            return this.parent.left;
        }
    }

    get grandparent () : RBNode<T> {
        if ( this.parent == null ) {
            return null;
        }

        return this.parent.parent;
    }

    constructor ( parent : RBNode<T>, value : T ) {
        this.parent = parent;
        this.value = value;

        this.left = null;
        this.right = null;
        this.color = RBColor.Red;
    }

    static toString ( node : RBNode<any> ) : string {
        if ( node == null ) {
            return "null";
        }

        let color = node.color == RBColor.Black ? 'B' : 'R';

        return `Node( ${ color }, ${ node.value.toString() }, ${ this.toString( node.left ) }, ${ this.toString( node.right ) } )`;
    }

    static getColor ( node : RBNode<any> ) : RBColor {
        if ( node == null ) {
            return RBColor.Black;
        }

        return node.color;
    }
}

export class RBTree<T> {
    root : RBNode<T>;

    comparator : Comparator<T>;

    constructor ( comparator : Comparator<T> ) {
        this.comparator = comparator;

        this.root = null;
    }

    protected isRed ( node : RBNode<T> ) : boolean {
        return node != null && node.color == RBColor.Red;
    }

    protected isBlack ( node : RBNode<T> ) : boolean {
        return !this.isRed( node );
    }

    protected rotateLeft ( root : RBNode<T> ) : RBNode<T> {
        const save = root.right;

        root.right = save.left;
        if ( save.left ) save.left.parent = root;
        save.left = root;

        save.parent = root.parent;
        root.parent = save;

        root.color = RBColor.Red;
        save.color = RBColor.Black;

        return save;
    }

    protected rotateRightLeft ( root : RBNode<T> ) : RBNode<T> {
        root.right = this.rotateRight( root.right );

        return this.rotateLeft( root );
    }

    protected rotateRight ( root : RBNode<T> ) : RBNode<T> {
        const save = root.left;

        root.left = save.right;
        if ( save.right ) save.right.parent = root;
        save.right = root;

        save.parent = root.parent;
        root.parent = save;

        root.color = RBColor.Red;
        save.color = RBColor.Black;

        return save;
    }
    
    protected rotateLeftRight ( root : RBNode<T> ) : RBNode<T> {
        root.left = this.rotateLeft( root.left );

        return this.rotateRight( root );
    }

    protected insertRecursive ( root : RBNode<T>, value : T ) : RBNode<T> {
        if ( root == null ) {
            root = new RBNode( root, value );
            
            return root;
        } else if ( this.comparator( root.value, value ) > 0 ) {
            root.left = this.insertRecursive( root.left, value );
            root.left.parent = root;

            if ( this.isRed( root.left ) ) {
                if ( this.isRed( root.right ) ) {
                    root.color = RBColor.Red;
                    root.left.color = RBColor.Black;
                    root.right.color = RBColor.Black;
                } else {
                    if (this.isRed( root.left.left ) ) {
                        root = this.rotateRight( root );
                    } else if ( this.isRed( root.left.right ) ) {
                        root = this.rotateLeftRight( root );
                    }
                }
            }
        } else {
            root.right = this.insertRecursive( root.right, value );
            root.right.parent = root;

            if ( this.isRed( root.right ) ) {
                if ( this.isRed( root.left ) ) {
                    root.color = RBColor.Red;
                    root.left.color = RBColor.Black;
                    root.right.color = RBColor.Black;
                } else {
                    if (this.isRed( root.right.right ) ) {
                        root = this.rotateLeft( root );
                    } else if ( this.isRed( root.right.left ) ) {
                        root = this.rotateRightLeft( root );
                    }
                }
            }
        }

        return root;
    }

    insert ( value : T ) {
        this.root = this.insertRecursive( this.root, value );
        if ( this.root && this.root.left ) this.root.left.parent = this.root;
        if ( this.root && this.root.right ) this.root.right.parent = this.root;

        this.root.color = RBColor.Red;
    }

    protected rotate ( node : RBNode<T>, dir : number ) : RBNode<T> {
        if ( dir == 0 ) {
            return this.rotateLeft( node );
        } else {
            return this.rotateRight( node );
        }
    }

    protected rotateDouble ( node : RBNode<T>, dir : number ) : RBNode<T> {
        if ( dir == 0 ) {
            return this.rotateRightLeft( node );
        } else {
            return this.rotateLeftRight( node );
        }
    }

    delete ( value : T ) {
        if ( this.root != null ) {
            const head : RBNode<T> = new RBNode( null, null );
            let q : RBNode<T>, p : RBNode<T>, g : RBNode<T>;
            let f : RBNode<T>;

            let dir = 1;
            let ord;

            /* Set up helpers */
            q = head;
            g = p = null;
            q.links[ 1 ] = this.root;

            /* Search and push a red down */
            while ( q.links[dir] != null ) {
                let last = dir;

                /* Update helpers */
                g = p, p = q;
                q = q.links[ dir ];
                ord = this.comparator( q.value, value );
                dir = ord < 0 ? 1 : 0;

                /* Save found node */
                if ( ord == 0 ) {
                    f = q;
                }

                /* Push the red node down */
                if ( this.isBlack( q ) && this.isBlack( q.links[ dir ] ) ) {
                    if ( this.isRed( q.links[ 1 - dir ] ) ) {
                        
                        p = p.links[last] = this.rotate( q, dir );
                    } else if ( this.isBlack( q.links[ 1 - dir ] ) ) {
                        const s = p.links[ 1 - last ];
                        // struct jsw_node *s = p->link[!last];

                        if ( s != null ) {
                            if ( this.isBlack( s.links[ 1 - last ] ) && this.isBlack( s.links[ last ] ) ) {
                                /* Color flip */
                                p.color = RBColor.Black;
                                s.color = RBColor.Red;
                                q.color = RBColor.Red;
                            } else {
                                let dir2 = g.links[ 1 ] == p ? 1 : 0;

                                if ( this.isRed( s.links[ last ] ) ) {
                                    g.links[ dir2 ] = this.rotateDouble( p, last ); // jsw_double(p, last);
                                } else if ( this.isRed( s.links[ 1 - last ] ) ) {
                                    g.links[ dir2 ] = this.rotate( p, last );
                                }

                                /* Ensure correct coloring */
                                q.color = g.links[ dir2 ].color = RBColor.Red;
                                g.links[ dir2 ].links[ 0 ].color = RBColor.Black;
                                g.links[ dir2 ].links[ 1 ].color = RBColor.Black;
                            }
                        }
                    }
                }
            }

            /* Replace and remove if found */
            if ( f != null ) {
                f.value = q.value;
                p.links[ p.links[ 1 ] == q ? 1 : 0 ] = q.links[ q.links[ 0 ] == null ? 1 : 0];
            }

            /* Update root and make it black */
            this.root = head.links[ 1 ];

            if ( this.root != null ) {
                this.root.color = RBColor.Black;
            }
        }
    }

    clear () {
        this.root = null;
    }

    find ( value : T ) : RBNode<T> {
        let node = this.root;

        while ( node != null ) {
            const order = this.comparator( node.value, value );

            if ( order == 0 ) {
                return node;
            } else if ( order > 0 ) {
                node = node.left;
            } else {
                node = node.right;
            }
        }

        return node;
    }

    previous ( node : RBNode<T> ) : RBNode<T> {
        // If there is a child on the left, we need to get the rightmost child of the left child
        if ( node.left ) {
            node = node.left;

            while ( node.right != null ) {
                node = node.right;
            }

            return node;
        }

        while ( node.parent != null && node.parent.left == node ) {
            node = node.parent;

            if ( node.parent == null ) {
                return null;
            }
        }

        return node.parent;
    }

    biggestUnder ( upperBound : T, included : boolean = true ) : RBNode<T> {
        let biggest : RBNode<T> = null;

        let node = this.root;

        while ( node != null ) {
            const order = this.comparator( node.value, upperBound );

            if ( order == 0 ) {
                if ( included ) {
                    return node;
                } else {
                    return this.previous( node );
                }
            // node.value < bound
            } else if ( order < 0 ) {
                biggest = node;

                node = node.right;
            // node.value > bound
            } else {
                node = node.left;
            }
        }

        return biggest;
    }

    smallestAbove ( lowerBound : T, included : boolean = true ) : RBNode<T> {
        let smallest : RBNode<T> = null;

        let node = this.root;

        while ( node != null ) {
            const order = this.comparator( node.value, lowerBound );

            if ( order == 0 ) {
                if ( included ) {
                    return node;
                } else {
                    return this.next( node );
                }
            // node.value < bound
            } else if ( order < 0 ) {
                node = node.right;
            // node.value > bound
            } else {
                smallest = node;

                node = node.left;
            }
        }

        return smallest;
    }

    smallestUnder ( upperBound : T, included : boolean = true ) : RBNode<T> {
        const smallest = this.first();

        if ( smallest ) {
            const order = this.comparator( smallest.value, upperBound );

            if ( ( order == 0 && included ) || order < 0 ) {
                return smallest;
            }
        }

        return null;
    }

    
    biggestAbove ( lowerBound : T, included : boolean = true ) : RBNode<T> {
        const biggest = this.last();

        if ( biggest ) {
            const order = this.comparator( biggest.value, lowerBound );

            if ( ( order == 0 && included ) || order > 0 ) {
                return biggest;
            }
        }

        return null;
    }

    closest ( bound : T ) : [ RBNode<T>, RBNode<T> ] {
        return [ this.biggestUnder( bound, false ), this.smallestAbove( bound, false ) ];
    }

    next ( node : RBNode<T> ) : RBNode<T> {
        // If there is a child on the left, we need to get the rightmost child of the left child
        if ( node.right ) {
            node = node.right;

            while ( node.left != null ) {
                node = node.left;
            }

            return node;
        }

        while ( node.parent != null && node.parent.right == node ) {
            node = node.parent;

            if ( node.parent == null ) {
                return null;
            }
        }

        return node.parent;
    }

    first () {
        let node = this.root;

        while ( node != null && node.left != null ) {
            node = node.left;
        }

        return node;
    }

    last () {
        let node = this.root;

        while ( node != null && node.right != null ) {
            node = node.right;
        }

        return node;
    }

    * [ Symbol.iterator ] () : IterableIterator<RBNode<T>> {
        let node = this.first();

        while ( node != null ) {
            yield node;

            node = this.next( node );
        }
    }

    * values () : IterableIterator<T> {
        for ( let node of this ) {
            yield node.value;
        }
    }

    * between ( lower : T, upper : T, included : boolean = true ) : IterableIterator<RBNode<T>> {
        if ( this.comparator( lower, upper ) < 0 ) {
            let lowerNode = this.biggestAbove( lower, true );

            while ( lowerNode != null ) {
                const orderLower = this.comparator( lower, lowerNode.value );
                const orderUpper = this.comparator( upper, lowerNode.value );

                if ( orderLower === 0 && included ) {
                    yield lowerNode;
                } else if ( orderUpper == 0 && included ) {
                    yield lowerNode;
                } else if ( orderUpper < 0 ) {
                    break;
                } else if ( orderLower < 0 && orderUpper > 0 ) {
                    yield lowerNode;
                }

                lowerNode = this.next( lowerNode );
            }
        } else {
            [ lower, upper ] = [ upper, lower ];

            let upperNode = this.biggestUnder( upper, true );

            while ( upperNode != null ) {
                const orderLower = this.comparator( lower, upperNode.value );
                const orderUpper = this.comparator( upper, upperNode.value );
    
                if ( orderLower === 0 && included ) {
                    yield upperNode;
                } else if ( orderUpper == 0 && included ) {
                    yield upperNode;
                } else if ( orderLower < 0 && orderUpper > 0 ) {
                    yield upperNode;
                } else if ( orderLower > 0 ) {
                    break;
                }
    
                upperNode = this.previous( upperNode );
            }
        }
    }

    print ( node ?: RBNode<T> ) {
        printTree( 
            node || this.root, 
            ( n : RBNode<T> ) => n ? '' + ( n.color == RBColor.Red ? 'R' : 'B' ) + ' ' + n.value + ' ' + ( n.parent ? n.parent.value : 'null' ) : '(null)',
            ( n : RBNode<T> ) => n ? [ n.left, n.right ] : []
        );
    }
}
