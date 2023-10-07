const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash"); //used to capitalised the first letter of routed path like /home to /Home
require('dotenv').config();

app=express();

app.use(bodyParser.urlencoded({encoding:true}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

const url= process.env.mongoDB_URL;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;

const db = mongoose.connection;

db.on('error', (error) => {
    console.error('Problem connecting to the database: ' + error);
});

db.once('open', () => {
    console.log('Connected to the database successfully!');
});

const itemSchema = {
    name:String
};

const Item = mongoose.model("Item",itemSchema);

const item1 = new Item({
    name:"Welcome to your todolist!"
});
const item2 = new Item({
    name:"Press the + button to add a new item."
});
const item3 = new Item({
    name:"Click on the checkbox to delete the item"
});


const defaultItems = [item1,item2,item3];
const listSchema = {
    name:String,
    items: [itemSchema]
};

const List = new mongoose.model("List",listSchema);

app.get("/",function(req,res)
{
    
    Item.find({}).then(
        foundItems=>{
            if(foundItems.length===0)
            {
                Item.insertMany(defaultItems).then(function () {
                    console.log("Successfully saved defult items to DB");
                  }).catch(function (err) {
                    console.log(err);
                  });
             res.redirect("/");
            }
            else{
            res.render("list",{listTitle:"Today",newListItems :foundItems});
            }
        }
    ).catch(
        err=>{console.log(err);}
    );

});

app.get("/:customListName",function(req,res)
{
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({name:customListName}).then(function(foundList)
    {
        if(!foundList)
        {
            //create a new list
            const list = new List({
                name: customListName,
                items: defaultItems
             });
             list.save();
             res.redirect("/"+customListName)
        }
        else
        {
            //show an existing list
            res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
        }
    }).catch(function(err)
    {
        console.log(err);
    })
    
})


//adding new items in the todolist
app.post("/",function(req,res)
{
    const itemName=req.body.newItem;
    const listName=req.body.list;
    const item =new Item({
        name:itemName
    });
    if(listName==="Today"){
    item.save();
    res.redirect("/");
    }
    else{
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        }).catch(function(err)
        {
            console.log(err);
        })
    }
});

//deleting items in the todolist
app.post("/delete",function(req,res)
{
    const checkedItemId=req.body.deleteItem;
    const listName=req.body.listName;
    if(listName==="Today")
    {
    Item.findByIdAndRemove(checkedItemId).then(function()
    {
        console.log("Successfully deleted the item from the DB");
        res.redirect("/");
    }
    ).catch(function(err){
        console.log(err);
    });
    }
    else
    {
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}).then(
        function(foundList)
        {
            res.redirect("/"+listName);
        }
        ).catch(function(err){
            console.log(err);
        });
    }

});

let port=process.env.PORT;
if(port==null||port=="")
{
    port=3000;
}
app.listen(port,function()
{
    console.log("Server is running on successfully");
});