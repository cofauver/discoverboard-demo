import sys
import os

from app import app


def main():
    if 'debug' in sys.argv or os.environ.get('DEBUG'):
        app.debug = True
    print 'main debug:', app.debug

    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)


if __name__ == '__main__':
    main()
