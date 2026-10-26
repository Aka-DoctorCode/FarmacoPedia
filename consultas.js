db.drugs.find()
db.drugs.find({ name: "acetaminofen" })
db.drugs.find({ "atc.subcategoryCode": "N02" })