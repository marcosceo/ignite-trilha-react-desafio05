import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
// eslint-disable-next-line import/no-extraneous-dependencies
import { useState } from 'react';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps): JSX.Element {
  const { results, next_page } = postsPagination;

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleNextPage(): Promise<void> {
    const postsResponse = await fetch(nextPage).then(response =>
      response.json()
    );
    const newPosts = postsResponse.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    const updatedPosts = [...posts, ...newPosts];

    setPosts(updatedPosts);
    setNextPage(postsResponse.next_page);
  }

  return (
    <div className={commonStyles.container}>
      <Header />
      <main className={styles.content}>
        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <ul>
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
              </ul>
            </a>
          </Link>
        ))}
        {nextPage !== null ? (
          <button type="button" onClick={handleNextPage}>
            Carregar mais posts
          </button>
        ) : (
          ''
        )}
        {preview && (
          <aside >
            <Link href="/api/exit-preview">
              <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({preview = false, previewData}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 2, page: 1, ref: previewData?.ref ?? null, }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview
    },
  };
};
