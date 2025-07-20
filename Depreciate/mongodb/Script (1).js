db.getCollection("farmacos").find({})


db.getCollection("farmacos").updateMany(
  { familia: "penicilina" },
  { $set: { familia: "penicilinas" } }
);
