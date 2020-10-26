ARG NGINX_VERSION=1.19.3
ARG NGINX_HTTP_FLV_VERSION=1.2.8

FROM alpine:3.12 AS base
RUN apk add --no-cache pcre openssl zlib


FROM alpine AS build
ARG NGINX_VERSION
ARG NGINX_HTTP_FLV_VERSION

RUN apk add build-base pcre-dev openssl-dev zlib-dev

WORKDIR /tmp
RUN \
    wget https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
    tar xzf nginx-${NGINX_VERSION}.tar.gz && \
    wget https://github.com/winshining/nginx-http-flv-module/archive/v${NGINX_HTTP_FLV_VERSION}.tar.gz && \
    tar xzf v${NGINX_HTTP_FLV_VERSION}.tar.gz && \
    cd nginx-${NGINX_VERSION} && \
    ./configure --add-module=../nginx-http-flv-module-${NGINX_HTTP_FLV_VERSION} --with-http_ssl_module --with-http_v2_module && \
    make && \
    make install


FROM base AS release
ARG SOURCE_COMMIT
ENV SOURCE_COMMIT $SOURCE_COMMIT
ENV LE_CONFIG_HOME="/acme"

COPY --from=build /usr/local/nginx /usr/local/nginx
COPY www/ /var/www/
COPY docker-entrypoint.sh /
COPY nginx/ /usr/local/nginx/conf/

RUN set -ex && \
    apk add --no-cache ca-certificates curl gettext socat && \
    curl -sSL https://get.acme.sh | sh && \
    crontab -l | sed "s|acme.sh --cron|acme.sh --cron --renew-hook \"/usr/local/nginx/sbin/nginx -s reload\"|g" | crontab - && \
    ln -s /root/.acme.sh/acme.sh /usr/bin/acme.sh && \
    chmod +x /docker-entrypoint.sh

RUN export BUILD_DATE=$(date) && \
    envsubst '${SOURCE_COMMIT} ${BUILD_DATE}' < /var/www/index.html > /var/www/index.html.tmp && \
    mv /var/www/index.html.tmp /var/www/index.html;

EXPOSE 1935
EXPOSE 80
EXPOSE 443
VOLUME ["/acme"]
CMD ["/docker-entrypoint.sh"]