var myDiagram;
var _G = go.GraphObject.make; // for conciseness in defining templates


// =========================================================================================================================== initDiagram
function initDiagram() {

  myDiagram =
    _G(go.Diagram, "myDiagramDiv", // create a Diagram for the DIV HTML element
      {
        // position the graph in the middle of the diagram
        initialContentAlignment: go.Spot.Center,
        // allow double-click in background to create a new node
        // "clickCreatingTool.archetypeNodeData": {
        //   text: "Node",
        //   color: "white"
        // },
        // allow Ctrl-G to call groupSelection()
        "commandHandler.archetypeGroupData": {
          text: "Module",
          isGroup: true,
          color: "blue"
        },
        // enable undo & redo
        "undoManager.isEnabled": true
      });
  // These nodes have text surrounded by a rounded rectangle
  // whose fill color is bound to the node data.
  // The user can drag a node by dragging its TextBlock label.
  // Dragging from the Shape will start drawing a new link.
  myDiagram.nodeTemplate =
    _G(go.Node, "Auto", {
        locationSpot: go.Spot.Center,
        desiredSize: new go.Size(100, 100)
      },
      _G(go.Shape, new go.Binding("figure", "fig"), {
          fill: "white", // the default fill, if there is no data-binding
          portId: "",
          cursor: "pointer", // the Shape is the port, not the whole Node
          // allow all kinds of links from and to this port
          fromLinkable: true,
          fromLinkableSelfNode: false,
          fromLinkableDuplicates: false,
          toLinkable: true,
          toLinkableSelfNode: false,
          toLinkableDuplicates: false
        },
        new go.Binding("fill", "color")),
        _G(go.Panel, "Table",
          { defaultAlignment: go.Spot.Left, margin: 4, cursor: "move" },
          _G(go.RowColumnDefinition, { column: 1, width: 4 }),
          _G(go.TextBlock,
            { row: 0, column: 0, columnSpan: 3, alignment: go.Spot.Center },
            { font: "bold 12pt sans-serif" },
            new go.Binding("text", "text")),
          _G(go.TextBlock, "Index: ",
            { row: 1, column: 0 },
            { font: "bold 8pt sans-serif" }),
          _G(go.TextBlock,
            { row: 1, column: 2 },
            { font: "8pt sans-serif" },
            new go.Binding("text", "key")),
          _G(go.TextBlock, "Name: ",
            { row: 2, column: 0 },
            { font: "bold 8pt sans-serif" }),
          _G(go.TextBlock,
            { row: 3, column: 0 },
            { font: "8pt sans-serif" },
            new go.Binding("text", "name"))
        ),
      { // this tooltip Adornment is shared by all nodes
        toolTip: _G(go.Adornment, "Auto",
          _G(go.Shape, {
            fill: "#FFFFCC"
          }),
          _G(go.TextBlock, {
              margin: 4
            }, // the tooltip shows the result of calling nodeInfo(data)
            new go.Binding("text", "", nodeInfo))
        ),
        // this context menu Adornment is shared by all nodes
        contextMenu: partContextMenu
      }
    );
  // The link shape and arrowhead have their stroke brush data bound to the "color" property
  myDiagram.linkTemplate =
    _G(go.Link, {
        toShortLength: 3,
        relinkableFrom: true,
        relinkableTo: true
      }, // allow the user to relink existing links
      _G(go.Shape, {
          strokeWidth: 2
        },
        new go.Binding("stroke", "color")),
      _G(go.Shape, {
          toArrow: "Standard",
          stroke: null
        },
        new go.Binding("fill", "color")), { // this tooltip Adornment is shared by all links
        toolTip: _G(go.Adornment, "Auto",
          _G(go.Shape, {
            fill: "#FFFFCC"
          }),
          _G(go.TextBlock, {
              margin: 4
            }, // the tooltip shows the result of calling linkInfo(data)
            new go.Binding("text", "", linkInfo))
        ),
        // the same context menu Adornment is shared by all links
        contextMenu: partContextMenu
      }
    );
  // Define the appearance and behavior for Groups:
  function groupInfo(adornment) { // takes the tooltip or context menu, not a group node data object
    var g = adornment.adornedPart; // get the Group that the tooltip adorns
    var mems = g.memberParts.count;
    var links = 0;
    g.memberParts.each(function(part) {
      if (part instanceof go.Link) links++;
    });
    return "Group " + g.data.key + ": " + g.data.text + "\n" + mems + " members including " + links + " links";
  }
  // Groups consist of a title in the color given by the group node data
  // above a translucent gray rectangle surrounding the member parts
  myDiagram.groupTemplate =
    _G(go.Group, "Vertical", {
        selectionObjectName: "PANEL", // selection handle goes around shape, not label
        ungroupable: true
      }, // enable Ctrl-Shift-G to ungroup a selected Group
      _G(go.TextBlock, {
          font: "bold 19px sans-serif",
          isMultiline: false, // don't allow newlines in text
          editable: true // allow in-place editing by user
        },
        new go.Binding("text", "text").makeTwoWay(),
        new go.Binding("stroke", "color")),
      _G(go.Panel, "Auto", {
          name: "PANEL"
        },
        _G(go.Shape, "Rectangle", // the rectangular shape around the members
          {
            fill: "rgba(128,128,128,0.2)",
            stroke: "gray",
            strokeWidth: 3
          }),
        _G(go.Placeholder, {
          padding: 10
        }) // represents where the members are
      ), { // this tooltip Adornment is shared by all groups
        toolTip: _G(go.Adornment, "Auto",
          _G(go.Shape, {
            fill: "#FFFFCC"
          }),
          _G(go.TextBlock, {
              margin: 4
            },
            // bind to tooltip, not to Group.data, to allow access to Group properties
            new go.Binding("text", "", groupInfo).ofObject())
        ),
        // the same context menu Adornment is shared by all groups
        contextMenu: partContextMenu
      }
    );
  // Define the behavior for the Diagram background:
  function diagramInfo(model) { // Tooltip info for the diagram's model
    return "Model:\n" + model.nodeDataArray.length + " nodes, " + model.linkDataArray.length + " links";
  }
  // provide a tooltip for the background of the Diagram, when not over any Part
  myDiagram.toolTip =
    _G(go.Adornment, "Auto",
      _G(go.Shape, {
        fill: "#FFFFCC"
      }),
      _G(go.TextBlock, {
          margin: 4
        },
        new go.Binding("text", "", diagramInfo))
    );
  // provide a context menu for the background of the Diagram, when not over any Part
  myDiagram.contextMenu =
    _G(go.Adornment, "Vertical",
      makeButton("Paste",
        function(e, obj) {
          e.diagram.commandHandler.pasteSelection(e.diagram.lastInput.documentPoint);
        },
        function(o) {
          return o.diagram.commandHandler.canPasteSelection();
        }),
      makeButton("Undo",
        function(e, obj) {
          e.diagram.commandHandler.undo();
        },
        function(o) {
          return o.diagram.commandHandler.canUndo();
        }),
      makeButton("Redo",
        function(e, obj) {
          e.diagram.commandHandler.redo();
        },
        function(o) {
          return o.diagram.commandHandler.canRedo();
        })
    );
}


// ============================================================================================================================== dragDrop
function dragDrop() {
  var dragged = null; // A reference to the element currently being dragged
  // This event should only fire on the drag targets.
  // Instead of finding every drag target,
  // we can add the event to the document and disregard
  // all elements that are not of class "draggable"
  document.addEventListener("dragstart", function(event) {
    if (event.target.className !== "draggable") return;
    // Some data must be set to allow drag
    event.dataTransfer.setData("text", "");
    // store a reference to the dragged element
    dragged = event.target;
    // Objects during drag will have a red border
    event.target.style.border = "2px solid red";
  }, false);
  // This event resets styles after a drag has completed (successfully or not)
  document.addEventListener("dragend", function(event) {
    // reset the border of the dragged element
    dragged.style.border = "";
  }, false);
  // Next, events intended for the drop target - the Diagram div
  var div = document.getElementById("myDiagramDiv");
  div.addEventListener("dragenter", function(event) {
    // Here you could also set effects on the Diagram,
    // such as changing the background color to indicate an acceptable drop zone
    // Requirement in some browsers, such as Internet Explorer
    event.preventDefault();
  }, false);
  div.addEventListener("dragover", function(event) {
    // We call preventDefault to allow a drop
    // But on divs that already contain an element,
    // we want to disallow dropping
    if (event.target.className === "dropzone") {
      // Disallow a drop by returning before a call to preventDefault:
      return;
    }
    // Allow a drop on everything else
    event.preventDefault();
  }, false);
  div.addEventListener("dragleave", function(event) {
    // reset background of potential drop target
    if (event.target.className == "dropzone") {
      event.target.style.background = "";
    }
  }, false);

  div.addEventListener("drop", function(event) {
    // prevent default action
    // (open as link for some elements in some browsers)
    event.preventDefault();
    console.log("DROP", event);
    // Dragging onto a Diagram
    if (this === myDiagram.div) {

      var can = event.target;
      var pixelratio = window.PIXELRATIO;
      // if the target is not the canvas, we may have trouble, so just quit:
      if (!(can instanceof HTMLCanvasElement)) return;
      var bbox = can.getBoundingClientRect();
      var bbw = bbox.width;
      if (bbw === 0) bbw = 0.001;
      var bbh = bbox.height;
      if (bbh === 0) bbh = 0.001;
      var mx = event.clientX - bbox.left * ((can.width / pixelratio) / bbw);
      var my = event.clientY - bbox.top * ((can.height / pixelratio) / bbh);
      var point = myDiagram.transformViewToDoc(new go.Point(mx, my));
      var shape, color, angle;
      var isGroup = false;
      if (dragged.textContent === "Module") {
        shape = "Rectangle";
        isGroup = true;
      } else if (dragged.textContent === "Learning") {
        shape = "RoundedRectangle";
        color = "lightgreen";
      }
      else if (dragged.textContent === "Quiz") {
        shape = "StopSign";
        color = "pink"
        angle = 30;
      }
      else shape = "NotAllowed";

      myDiagram.startTransaction('new node');
      myDiagram.model.addNodeData({
        location: point,
        text: dragged.textContent,
        fig: shape,
        isGroup: isGroup,
        color: color,
        angle: angle
      });
      myDiagram.commitTransaction('new node');
    }
    // If we were using drag data, we could get it here, ie:
    // var data = event.dataTransfer.getData('text');
  }, false);
}


// =========================================================================================================================== loadContent
function loadContent(event) {
  // Create the Diagram's Model:
  nodeDataArray = [{
    "name": "Intro",
    "text": "Learning",
    "fig": "RoundedRectangle",
    "color": "lightgreen",
    "isGroup": false,
    "key": 1,
    "group": -1
  }, {
    "name": "Lesson 1",
    "text": "Learning",
    "fig": "RoundedRectangle",
    "color": "lightgreen",
    "isGroup": false,
    "key": 2,
    "group": -1
  }, {
    "name": "Sample",
    "text": "Quiz",
    "fig": "Octagon",
    "color": "pink",
    "isGroup": false,
    "key": 3,
    "group": -1
  }, {
    "text": "Module 1",
    "isGroup": true,
    "color": "blue",
    "key": -1
  }, {
    "name": "Sync up",
    "text": "Learning",
    "fig": "RoundedRectangle",
    "color": "lightgreen",
    "isGroup": false,
    "key": 4,
    "group": -2
  }, {
    "name": "Refresh",
    "text": "Quiz",
    "fig": "Octagon",
    "color": "pink",
    "isGroup": false,
    "key": 5,
    "group": -2
  }, {
    "name": "Extra",
    "text": "Learning",
    "fig": "RoundedRectangle",
    "color": "lightgreen",
    "isGroup": false,
    "key": 6,
    "group": -2
  }, {
    "name": "Extra 2",
    "text": "Learning",
    "fig": "RoundedRectangle",
    "color": "lightgreen",
    "isGroup": false,
    "key": 7,
    "group": -2
  }, {
    "name": "Summary",
    "text": "Learning",
    "fig": "RoundedRectangle",
    "color": "lightgreen",
    "isGroup": false,
    "key": 8,
    "group": -2
  }, {
    "name": "Evaluation",
    "text": "Quiz",
    "fig": "Octagon",
    "color": "pink",
    "isGroup": false,
    "key": 9,
    "group": -2
  }, {
    "text": "Module 2",
    "isGroup": true,
    "color": "blue",
    "key": -2
  }];
  linkDataArray = [{
    "from": 1,
    "to": 2
  }, {
    "from": 2,
    "to": 3
  }, {
    "from": 4,
    "to": 5
  }, {
    "from": 5,
    "to": 6
  }, {
    "from": 6,
    "to": 7
  }, {
    "from": 7,
    "to": 8
  }, {
    "from": 8,
    "to": 9
  }];
  myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
}


// ========================================================================================================================= LOADING POINT
$("document").ready(function() {
  initDiagram();

  dragDrop();

  $("#loadContent").click(function(event) {
    loadContent(event);
  });
});


// ================================================================================================================================ helper
// HELPER STUFF
var partContextMenu =
  _G(go.Adornment, "Vertical",
    makeButton("Properties",
      function(e, obj) { // OBJ is this Button
        var contextmenu = obj.part; // the Button is in the context menu Adornment
        var part = contextmenu.adornedPart; // the adornedPart is the Part that the context menu adorns
        // now can do something with PART, or with its data, or with the Adornment (the context menu)
        if (part instanceof go.Link) console.log("Link", part.data);
        else if (part instanceof go.Group) console.log("Group", part.data);
        else console.log("Node", part.data);
      })
  );

function makeButton(text, action, visiblePredicate) {
  return _G("ContextMenuButton",
    _G(go.TextBlock, text), {
      click: action
    },
    // don't bother with binding GraphObject.visible if there's no predicate
    visiblePredicate ? new go.Binding("visible", "", visiblePredicate).ofObject() : {});
}
// a context menu is an Adornment with a bunch of buttons in them

function nodeInfo(d) { // Tooltip info for a node data object
  var str = "Node " + d.key + ": " + d.text + "\n";
  if (d.group)
    str += "member of " + d.group;
  else
    str += "top-level node";
  return str;
}

// Define the appearance and behavior for Links:
function linkInfo(d) { // Tooltip info for a link data object
  return "Link:\nfrom " + d.from + " to " + d.to;
}
