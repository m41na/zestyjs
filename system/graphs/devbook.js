//nodes represent people (names)
//edges represent friendship

let MakeGraph = () => {   // Function that will create our graphs
    let graph = {};

    graph.addVertex = (node) => {
        // add members as vertices here
        //  store their connections as properties on an edges object

        graph[node] = { edges: {} };
    }

    graph.removeVertex = (node) => {
        if (graph.contains(node)) {
            // We need to remove any existing edges the node has
            for (let connectedNode in graph[node].edges) {
                graph.removeEdge(node, connectedNode);
            }
            delete graph[node];
        }

    }

    graph.contains = (node) => { // you can check whether a user exists
        return !!graph[node];
    }

    graph.addEdge = (startNode, endNode) => {
        // Only if both nodes exist
        // Add each node to the others edge list

        if (graph.contains(startNode) && graph.contains(endNode)) {
            graph[startNode].edges[endNode] = true;
            graph[endNode].edges[startNode] = true;
        }
    } 

    graph.removeEdge = (startNode, endNode) => {
        if (graph.contains(startNode) && graph.contains(endNode)) {
            delete graph[startNode].edges[endNode]
            delete graph[endNode].edges[startNode]
        }
    }

    return graph;
}

//example- create a dev-book

let devBook = MakeGraph();

//Let's add some people (create nodes)

devBook.addVertex('James Gosling');
devBook.addVertex('Guido Rossum');
devBook.addVertex('Linus Torvalds');
devBook.addVertex('Michael Olorunnisola');

// We'll create friendships here (add edges)!

devBook.addEdge('James Gosling', 'Guido Rossum');
devBook.addEdge('Linus Torvalds', 'Michael Olorunnisola');

// Now we can remove users!

devBook.removeVertex('Linus Torvalds');

console.log(devBook);