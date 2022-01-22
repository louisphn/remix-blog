import { useLoaderData, Link, redirect } from "remix";
import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export const loader = async ({ request, params }) => {
  const post = await db.post.findUnique({
    where: { id: params.postId },
  });

  const user = await getUser(request);

  if (!post) throw new Error("Post not found");

  const data = {
    post,
    user,
  };
  return data;
};

export const action = async ({ request, params }) => {
  const form = await request.formData();
  const user = await getUser(request);

  if (form.get("_method") === "delete") {
    const post = await db.post.findUnique({
      where: { id: params.postId },
    });

    if (!post) throw new Error("Post not found");

    if (user && post.userId === user.id) {
      await db.post.delete({
        where: { id: params.postId },
      });
      return redirect("/posts");
    }
  }
};

function Post() {
  const { user, post } = useLoaderData();
  return (
    <>
      <div className="page-header">
        <h1>{post.title}</h1>
        <Link to="/posts" className="btn btn-reverse">
          Back
        </Link>
      </div>
      <div className="page-content">{post.body}</div>
      {user && post.userId === user.id && (
        <div className="page-footer">
          <form method="POST">
            <input type="hidden" name="_method" value="delete" />
            <button className="btn btn-delete">Delete</button>
          </form>
        </div>
      )}
    </>
  );
}

export default Post;
