import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      }
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      }
    }[];
  };
  preview: boolean
}

export default function Post({ post, navigation, preview }: PostProps): JSX.Element {

  let words = [];
  post.data.content.map(item => {
    const headingWords = item.heading.split(' ');
    words = [...words, ...headingWords];
    item.body.map(bodyItem => {
      const bodyWords = bodyItem.text.split(' ');
      words = [...words, ...bodyWords];
    });
  });
  const totalWords = words.length;
  const readingTime = Math.ceil(totalWords / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <div className={commonStyles.container}>
      <Header />
      <div className={styles.banner}>
        <Image src={post.data.banner.url} alt="" layout="fill" />
      </div>
      <main className={styles.content}>
        <h1>{post.data.title}</h1>
        <ul className={styles.details}>
          <li>
            <FiCalendar />
            {format(new Date(post.first_publication_date), 'd MMM yyyy', {
              locale: ptBR,
            })}
          </li>
          <li>
            <FiUser />
            {post.data.author}
          </li>
          <li>
            <FiClock />
            {`${readingTime} min`}
          </li>
        </ul>
        {post.last_publication_date !== post.first_publication_date &&
          <p className={styles.edited}>*editado em {format(new Date(post.last_publication_date), 'd MMM yyyy', { locale: ptBR, })}, às {format(new Date(post.last_publication_date), 'H:mm', { locale: ptBR, })}</p>
        }
        {post.data.content.map(content => {
          return (
            <article className={styles.article} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                className={styles.postContent}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          )
        })}
      </main>
      <section className={styles.navigation}>
        {navigation?.prevPost.length > 0 && (
          <div className={styles.prevPost}>
            <h3>{navigation.prevPost[0].data.title}</h3>
            <Link href={`/post/${navigation.prevPost[0].uid}`}>
              <a>Post anterior</a>
            </Link>
          </div>
        )}
        {navigation?.nextPost.length > 0 && (
          <div className={styles.nextPost}>
            <h3>{navigation.nextPost[0].data.title}</h3>
            <Link href={`/post/${navigation.nextPost[0].uid}`}>
              <a>Próximo post</a>
            </Link>
          </div>
        )}

      </section>
      <Comments />
      {preview && (
        <aside >
          <Link href="/api/exit-preview">
            <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', `${slug}`, {
    ref: previewData?.ref || null
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  )

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  )

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      },
      preview
    },
  };
};
