var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mysql = require("mysql");
var multer = require("multer");
var cors = require("cors");

app.use(bodyParser.json());
app.use(cors());
app.use(
	bodyParser.urlencoded({
		extended: true
	})
);
app.use(express.static("uploads"));

// default route
app.get("/", function(req, res) {
	return res.send({ error: true, message: "hello" });
});


// connection configurations

var dbConn = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "mysql_123",
	database: "product"
});

dbConn.connect();

// Retrieve all users
app.get("/products", function(req, res) {
	dbConn.query("SELECT * FROM products", function(error, results, fields) {
		if (error) throw error;
		return res.json({ error: false, data: results, message: "products list." });
	});
});

let storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, "uploads");
	},
	filename: function(req, file, cb) {
		cb(null, Date.now() + "-" + file.originalname);
	}
});

let upload = multer({ storage: storage }).single("file");

app.post("/add_product", function(req, res) {
	try {
		upload(req, res, async function(err) {
			if (err instanceof multer.MulterError) {
				return res.status(500).json(err);
			} else if (err) {
				return res.status(500).json(err);
			}
			const { name, description, price } = req.body;
			let photo = req.file.filename;
			dbConn.query(
				"INSERT INTO products SET ? ",
				{ name: name, description: description, photo: photo, price: price, like_count: 0 },
				function(error, results, fields) {
					if (error) throw error;
					return res.json({
						error: false,
						data: results,
						message: "New product has been created successfully."
					});
				}
			);
		});
	} catch (err) {
		console.log(err);
		res.json({
			success: false
		});
	}
});

//  Update user with id
app.put("/product", function(req, res) {
	let product = req.body.product;
	let { id, like_count } = product;
	if (!product) {
		return res.status(400).send({ error: product, message: "Please provide product" });
	}

	dbConn.query("UPDATE products SET like_count = ? WHERE id = ?", [like_count, id], function(error, results, fields) {
		if (error) throw error;
		return res.send({ error: false, data: results, message: "Product has been updated successfully." });
	});
});


app.listen(5000, function() {
	console.log("App is running on port 5000");
});

module.exports = app;
