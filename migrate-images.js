require("dotenv").config();

const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateImages() {

  const { data: menu, error } =
  await supabase
  .from("menu")
  .select("*");

  if (error) {
    console.log(error);
    return;
  }

  for (const item of menu) {

    if (
      !item.image ||
      !item.image.startsWith("/uploads/")
    ) {
      continue;
    }

    const filename =
      item.image.replace("/uploads/", "");

    const filePath =
      path.join(__dirname, "uploads", filename);

    if (!fs.existsSync(filePath)) {

      console.log(
        "Missing file:",
        filename
      );

      continue;
    }

    console.log(
      "Uploading:",
      filename
    );

    const result =
      await cloudinary.uploader.upload(
        filePath,
        {
          folder: "rupa-cafe"
        }
      );

    await supabase
      .from("menu")
      .update({
        image: result.secure_url
      })
      .eq("id", item.id);

    console.log(
      "Updated:",
      item.name
    );

  }

  console.log(
    "IMAGE MIGRATION COMPLETED"
  );
}

migrateImages();