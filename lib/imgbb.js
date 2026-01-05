import fetch from "node-fetch";
import FormData from "form-data";

const IMGBB_KEY = process.env.IMGBB_KEY;

export async function uploadToImgBB(buffer, filename) {
  const form = new FormData();
  form.append("image", buffer, filename);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
    {
      method: "POST",
      body: form
    }
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error("ImgBB upload failed");
  }

  return {
    url: json.data.url,
    delete_url: json.data.delete_url
  };
}
