const express = require('express');
const app = express()
const PORT = 9000;

require('dotenv').config();
const db = require('ibm_db');
const connStr = `DATABASE=${process.env.DB_NAME};HOSTNAME=${process.env.DB_HOST};PORT=${process.env.DB_PORT};PROTOCOL=${process.env.DB_PROTOCOL};UID=${process.env.DB_UID};PWD=${process.env.DB_PWD};`

app.use(express.json());
app.listen(PORT,() => console.log(`it's alive on http://localhost:${PORT}`))

app.post('/sign-in',(req,res)=>{
  let {username,password} = req.body;
  db.open(connStr, function (connErr, connection) {
    if (connErr){ 
      console.log(connErr);
      return;
    }
    connection.query(`select * from spw05319.checklist_users where user_name = '${username}' and user_pass = '${password}'` , function (fetchErr, rows) {      
      if (fetchErr) console.log(fetchErr);
      else {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.status(200).send({data : rows });       
      }   
      connection.close(function(closeErr) {
        if(closeErr) console.log(closeErr);
      });
    });
  });
});

app.post('/sign-up',(req,res)=>{
  let {username,password} = req.body;
  db.open(connStr, function (connErr, connection) {
    if (connErr){ 
      console.log(connErr);
      return;
    }
    let result = connection.querySync(`select * from spw05319.checklist_users where user_name = '${username}'`);
    if (result.length>0) {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.status(200).send({response : "failure :("});
    }
    else {
      let newResult = connection.querySync(`select * from new table(insert into spw05319.checklist_users(user_name,user_pass) values (?,?))`,[username,password]);
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
      res.status(200).send({data:newResult});
    }
  });
});

app.get('/users/:id',(req,res)=>{
  let id = req.params.id;
  db.open(connStr, function (connErr, connection) {
      if (connErr){ 
        console.log(connErr);
        return;
      }
      connection.query(`select * from spw05319.checklist_items where user_id = ${id}` , function (fetchErr, rows) {      
        if (fetchErr) console.log(fetchErr);
        else {
          res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
          res.status(200).send({data : rows, });       
        }   
        connection.close(function(closeErr) {
          if(closeErr) console.log(closeErr);
        });
      });
  });
});

app.post('/users/:id',(req,res)=>{
    const { id } = req.params;
    const { ITEM_NAME,ITEM_DONE } = req.body;
    db.open(connStr,function(connErr,connection){
      connection.prepare(`insert into spw05319.checklist_items(item_name,item_done,user_id) values (?,?,?)`,function(prepErr,statement){
        if (prepErr){
          console.log(prepErr);
          return connection.closeSync();
        }
        statement.execute([ITEM_NAME,ITEM_DONE,id], function (execErr, result) {
          if( execErr ) console.log(execErr);
          else {
            result.closeSync();
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
            res.setHeader('Access-Control-Allow-Methods','POST');
            res.send({response : 'success !'});
          }
    
          statement.close(function(closeErr){
            if(closeErr) console.log(closeErr)
            connection.close(function(error){});
          });
      });
    });
  });
});

//preflight request of cors
app.options('/users/:id',(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods','POST');
  res.setHeader('Access-Control-Allow-Headers','*');
  res.status(200).send();
});

app.options('/sign-in',(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods','POST');
  res.setHeader('Access-Control-Allow-Headers','*');
  res.status(200).send();
});

app.options('/sign-up',(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods','POST');
  res.setHeader('Access-Control-Allow-Headers','*');
  res.status(200).send();
});
//->https://github.com/ibmdb/node-ibm_db/
//->https://developer.ibm.com/technologies/containers/tutorials/building-docker-images-locally-and-in-cloud/