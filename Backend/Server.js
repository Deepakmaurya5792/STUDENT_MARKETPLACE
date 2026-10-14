const express=require("express")
const app=express();
const PORT=300;
app.get("/",(req,res)=>{
    res.send("This is the homepage")
})
app.listen(PORT,()=>{
    console.log("Server is running");
})