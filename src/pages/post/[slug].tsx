import { GetStaticPaths, GetStaticProps } from 'next';
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

interface Post {
  first_publication_date: string | null;
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
}

export default function Post(props: PostProps): JSX.Element {
  const { post } = props;
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

  if(router.isFallback) {
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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', `${slug}`, {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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
    props: { post },
  };
};
