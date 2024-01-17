import {json} from '@shopify/remix-oxygen';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {useLoaderData} from '@remix-run/react';
import {CartForm, getSelectedProductOptions} from '@shopify/hydrogen';
import {redirect} from '@remix-run/server-runtime';
import VariantProductOptions from '~/components/product/VariantProductOptions';

const seo = ({data}) => ({
  title: data?.product?.title,
  description: data?.product?.description.substr(0, 154),
});

export const handle = {
  seo,
};

export async function loader({params, context, request}) {
  const {handle} = params;
  const selectedOptions = getSelectedProductOptions(request);

  const {product, shop} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions,
    },
  });

  // Set a default variant so you always have an "orderable" product selected
  if (!product.selectedVariant) {
    const searchParams = new URLSearchParams(new URL(request.url).search);
    const firstVariant = product.variants.nodes[0];

    for (const option of firstVariant.selectedOptions) {
      searchParams.set(option.name, option.value);
    }

    throw redirect(
      `/products/${handle}?${searchParams.toString()}`,
      302, // Make sure to use a 302, because the first variant is subject to change
    );
  }

  // Handle 404s
  if (!product) {
    throw new Response(null, {status: 404});
  }

  return json({product, shop});
}

export default function Product() {
  const {product, shop} = useLoaderData();

  return (
    <section className="w-full gap-4 md:gap-8 grid px-6 md:px-8 lg:px-12">
      <div className="grid items-start gap-6 lg:gap-20 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid md:grid-flow-row  md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
          <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-[80vw] shadow rounded">
            <Image
              className={`w-full h-full aspect-square object-cover`}
              data={product.selectedVariant?.image || product.featuredImage}
            />
          </div>
        </div>
        <div className="md:sticky md:mx-auto max-w-xl md:max-w-[24rem] grid gap-2 p-0 md:p-6 md:px-0 top-[6rem] lg:top-[8rem] xl:top-[10rem]">
          <div className="grid gap-2">
            <h1 className="text-4xl font-bold leading-10 whitespace-normal">
              {product.title}
            </h1>
            <span className="max-w-prose whitespace-pre-wrap inherit text-copy opacity-50 font-medium">
              {product.vendor}
            </span>
          </div>
          <VariantProductOptions product={product} />
          <Money
            withoutTrailingZeros
            data={product.selectedVariant?.price}
            className="text-xl font-semibold mb-2"
          />
          {product.selectedVariant?.availableForSale && (
            <ShopPayButton
              storeDomain={shop.primaryDomain.url}
              variantIds={[product.selectedVariant?.id]}
              width={'400px'}
            />
          )}
          <CartForm
            route="/cart"
            inputs={{
              lines: [
                {
                  merchandiseId: product.selectedVariant?.id,
                },
              ],
            }}
            action={CartForm.ACTIONS.LinesAdd}
          >
            {(fetcher) => (
              <>
                <button
                  type="submit"
                  onClick={() => {
                    window.location.href = window.location.href + '#cart-aside';
                  }}
                  disabled={
                    !product.selectedVariant?.availableForSale ??
                    fetcher.state !== 'idle'
                  }
                  className="border border-black rounded-sm w-full px-4 py-2 text-white bg-black uppercase hover:bg-white hover:text-black transition-colors duration-150"
                >
                  {product.selectedVariant?.availableForSale
                    ? 'Add to cart'
                    : 'Sold out'}
                </button>
              </>
            )}
          </CartForm>

          <div
            className="prose border-t border-gray-200 pt-6 text-black text-md"
            dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
          ></div>
        </div>
      </div>
    </section>
  );
}

const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    shop {
      primaryDomain {
        url
      }
    }
    product(handle: $handle) {
      id
      title
      handle
      vendor
      description
      descriptionHtml
      featuredImage{
        id
        url
        altText
        width
        height
      }
      options {
        name,
        values
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;
