const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.connect("mongodb+srv://hshekhar:yzl5L6IxGLlTXEyO@todo.1a5g1iu.mongodb.net/CHECKER");

mongoose.connection.on('connected', () => {
    console.log("Connected to MongoDB successfully");
    const itemSchema = new mongoose.Schema({
        name: String
    })

    const Item = mongoose.model("Item", itemSchema);
    const item1 = new Item({
        name: "Workout"
    });
    const item2 = new Item({
        name: "Breakfast"
    });
    const item3 = new Item({
        name: "Study"
    });
    const defaultItems = [item1, item2, item3];
    const listSchema = {
        name: String,
        items: [itemSchema]
    };
    const List = mongoose.model("List", listSchema);
    app.get("/", function(req, res) {
        Item.find()
            .then((items) => {
                if (items.length === 0) {
                    Item.insertMany(defaultItems)
                        .then(() => {
                            console.log("Default items saved Succesfully!");
                        })
                        .catch((err) => {
                            console.log(err);
                        })
                    res.redirect("/");
                } else {
                    res.render("list", { listTitle: "Today", newListItems: items });
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });

    app.get("/:customListName", function(req, res) {
        const customListName = _.capitalize(req.params.customListName);

        List.findOne({ name: customListName })
            .then((foundList) => {
                if (!foundList) {
                    const list = new List({
                        name: customListName,
                        items: defaultItems
                    });

                    list.save()
                        .then(() => {
                            res.redirect("/" + customListName);
                        })
                        .catch((error) => {
                            console.log(error);
                            res.redirect("/");
                        });
                } else {
                    res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
                }
            })
            .catch((error) => {
                console.log(error);
                res.redirect("/");
            });
    });

    app.post("/", function(req, res) {
        const itemName = req.body.newItem;
        const listName = req.body.button;
        const addItem = new Item({
            name: itemName
        })

        if (listName === "Today") {
            addItem.save();
            res.redirect("/");
        } else {
            List.findOne({ name: listName })
                .then((foundList) => {
                    foundList.items.push(addItem);
                    return foundList.save();
                })
                .then(() => {
                    res.redirect("/" + listName);
                })
                .catch((error) => {
                    console.log(error);
                    res.redirect("/");
                });
        }
    });

    app.post("/delete", function(req, res) {
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;
        if (listName === "Today") {
            Item.findByIdAndRemove(checkedItemId)
                .then(() => {
                    console.log("Item with id : " + checkedItemId + " is removed.");
                    res.redirect("/");
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
                .then((foundList) => {
                    res.redirect("/" + listName);
                })
                .catch((error) => {
                    console.log(error);
                    res.redirect("/");
                });
        }
    });

    app.get("/work", function(req, res) {
        res.render("list", { listTitle: "Work", newListItems: workItems });
    });

    app.get("/about", function(req, res) {
        res.render("about");
    });

    app.listen(port, function() {
        console.log("Server started on port : " + port + " ...");
    });
});