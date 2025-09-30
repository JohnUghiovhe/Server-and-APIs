const http = require("http");
const fs = require("fs");
const path = require("path");

const itemsDbPath = path.join(__dirname, "files", "items.json");
let itemsDB = [];

const PORT = 3003;
const HOST_NAME = "localhost";

const requestHandler = function (req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/items" && req.method === "GET") {
    getAllItems(req, res);
  } else if (req.url.startsWith("/items/") && req.method === "GET") {
    getItemById(req, res);
  } else if (req.url === "/items" && req.method === "POST") {
    addItem(req, res);
  } else if (req.url === "/items" && req.method === "PUT") {
    updateItem(req, res);
  } else if (req.url.startsWith("/items") && req.method === "DELETE") {
    deleteItem(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({message: "Method Not Supported"}));
  }
};

//GET ITEMS 
const getAllItems = function (req, res) {
  fs.readFile(itemsDbPath, "utf8", (err, items) => {
    if (err) {
      console.log(err);
      res.writeHead(400);
      res.end("An error occured");
    }
    res.end(items);
  });
};

//GET ITEM BY ID
function getItemById(req, res, itemId) {
  fs.readFile(itemsDbPath, "utf8", (err, items) => {
    if (err) {
      console.log(err);
      res.writeHead(400);
      res.end("An error occured");
    }
    const itemsObj = JSON.parse(items);
    const item = itemsObj.find((item) => item.id === itemId);
    if (!item) {
      res.writeHead(404);
      res.end("Item not found");
      return;
    }
    res.end(JSON.stringify(item));
  });
}

// CREATE AN ITEM ==> POST
const addItem = function (req, res) {
  const body = [];

  req.on("data", (chunk) => {
    body.push(chunk); // push each data received to the body array
  });
  req.on("end", () => {
    const parsedBody = Buffer.concat(body).toString(); // concatenate raw data into a single buffer string
    const newItem = JSON.parse(parsedBody); // parse the buffer string into a JSON object

    // get ID of last item in the database
    const lastItem = itemsDB[itemsDB.length - 1];
    const lastItemId = lastItem.id;
    let newItemId = { ...newItem, id: lastItemId + 1 };

    //save to db
    itemsDB.push(newItemId);
    fs.writeFile(itemsDbPath, JSON.stringify(itemsDB), (err) => {
      if (err) {
        console.log(err);
        res.writeHead(500);
        res.end(JSON.stringify({
            message: "Internal Server Error. Could not save item to database.",
          }));
      }
      res.end(JSON.stringify(newItem));
    });
  });
};

// UPDATE AN ITEM ==> PUT
function updateItem(req, res) {
  const body = [];
  req.on("data", (chunk) => {
    body.push(chunk);
  });

  req.on("end", () => {
    const parsedItem = Buffer.concat(body).toString();
    const updateDetails = JSON.parse(parsedItem);
    const itemId = updateDetails.id;

    fs.readFile(itemsDbPath, "utf8", (err, items) => {
      if (err) {
        console.log(err);
        res.writeHead(404);
        res.end("An error occurred");
      }

      const itemsObj = JSON.parse(items);

      // find the item in the database
      const itemIndex = itemsObj.findIndex((item) => item.id === itemId);

      if (itemIndex === -1) {
        res.writeHead(404);
        res.end("Item with the specified id not found!");
        return;
      }

      // update the item in the database
      const updatedItem = { ...itemsObj[itemIndex], ...updateDetails };
      itemsObj[itemIndex] = updatedItem;

      fs.writeFile(itemsDbPath, JSON.stringify(itemsObj), (err) => {
        if (err) {
          console.log(err);
          res.writeHead(500);
          res.end(
            JSON.stringify({
              message:
                "Internal Server Error. Could not update book in database.",
            })
          );
        }
        res.writeHead(200);
        res.end("Update successful!");
      });
    });
  });
}

// DELETE AN ITEM ==> DELETE
const deleteItem = function (req, res) {
  const itemId = req.url.split("/")[2];

  // Remove item from database
  const itemIndex = itemsDB.findIndex((item) => {
    return item.id === parseInt(itemId);
  });
  
  if (itemIndex === -1) {
    res.writeHead(404);
    res.end(JSON.stringify({message: "Item not found"}));
    return;
  }
  itemsDB.splice(itemIndex, 1); // remove the item from the database using the index.

  // update the db
  fs.writeFile(itemsDbPath, JSON.stringify(itemsDB), (err) => {
    if (err) {
      console.log(err);
      res.writeHead(500);
      res.end(JSON.stringify({
          message: "Internal Server Error. Could not delete item from database.",
        }));
    }
    res.end(JSON.stringify({message: "Item deleted"}));
  });
};

// Create server
const server = http.createServer(requestHandler);

server.listen(PORT, HOST_NAME, () => {
  itemsDB = JSON.parse(fs.readFileSync(itemsDbPath, "utf8"));
  console.log(`Server is listening on ${HOST_NAME}:${PORT}`);
});