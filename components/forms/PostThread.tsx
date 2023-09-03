"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import AddIcon from "@mui/icons-material/Add";
import { ChangeEvent, useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.actions";
import { isBase64Image } from "@/lib/utils";

interface Props {
  userId: string;
  postImage: string;
}

function PostThread({ userId, postImage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const { organization } = useOrganization();

  const form = useForm<z.infer<typeof ThreadValidation>>({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: "",
      accountId: userId,
    },
  });

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string | null) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) return;

      fileReader.onload = (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        fieldChange(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    try {
      // Check if the image has changed
      const hasImageChanged = uploadedImage;

      // If the image has changed, upload it
      if (hasImageChanged) {
        const imgRes = await startUpload(files);

        if (imgRes && imgRes[0].fileUrl) {
          setUploadedImage(imgRes[0].fileUrl);
        }
      }

      // Create the thread with the updated image URL
      await createThread({
        text: values.thread,
        author: userId,
        communityId: organization ? organization.id : null,
        path: pathname,
        postImage: uploadedImage,
      });
      console.log(createThread);

      router.push("/");
    } catch (error) {
      console.error("Error creating thread:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        className="mt-10 flex flex-col justify-start gap-10"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-3">
              <FormLabel className="text-base-semibold text-light-2">
                Content
              </FormLabel>
              <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-full flex-col gap-3">
          <FormLabel className="text-base-semibold text-light-2">
            Image
          </FormLabel>
          <input
            type="file"
            onChange={(e) => handleImage(e, setUploadedImage)}
          />
          {uploadedImage && <img src={uploadedImage} alt="Uploaded" />}
        </div>
        <Button
          type="submit"
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        >
          Post Thread
        </Button>
      </form>
    </Form>
  );
}

export default PostThread;
