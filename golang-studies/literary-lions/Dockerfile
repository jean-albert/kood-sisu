FROM golang:1.22.5-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=1
RUN go build -o main .

FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache sqlite-libs
RUN apk add --no-cache tzdata

COPY --from=builder /app/main .

COPY --from=builder app/templates /app/templates
COPY --from=builder app/static /app/static
COPY --from=builder app/schema /app/schema
COPY --from=builder app/db /app/db

EXPOSE 8080

CMD ["./main"]
