import javax.swing.*;
import java.awt.*;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;
import java.awt.event.*;

public class BaseRunner extends JComponent implements KeyListener, ActionListener {
    private ArrayList<Ball> ball;
    private Pitcher pitcher;
    private ArrayList<Bomb> bomb;

    private int pitcherX = 20;
    private int pitcherY = 50;
    int ballX = 150;
    int ballY = 200;
    private Timer timer;

    public BaseRunner() {

        ball = new ArrayList<>(20);
        pitcher = new Pitcher(pitcherX, pitcherY);
        bomb = new ArrayList<>();
        Random random = new Random();

        // Add this line to see a ball at start
        // ...existing code...

        timer = new Timer(100, new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                Iterator<Ball> ballIterator = ball.iterator();

                while (ballIterator.hasNext()) {

                    Ball ball = ballIterator.next();

                    if (ball.sider == false) {
                        ball.move();
                    } else {
                        ball.movel();
                    }
                    if (ball.hit == true) {
                        ballIterator.remove();
                    }

                    checkCollisions();
                    repaint();
                }

            }

        });
        timer.start();
        timer = new Timer(100, new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {

                Iterator<Bomb> bombIterator = bomb.iterator();
                while (bombIterator.hasNext()) {
                    Bomb bomb = bombIterator.next();

                    bomb.fall();
                    if (bomb.explode == false) {
                        bomb.fall();
                    }
                    if (bomb.explode == true) {
                        bombIterator.remove();

                    }

                    checkCollisions();
                    repaint();
                }

            }

        });
        timer.start();

        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                pitcher.handleKeyPress(e);
            }
        });
        setFocusable(true);
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {

            }
        });
    }

    private boolean checkCollisions() {
        boolean hit = false;

        for (Ball ballz : ball) {

            if (ballz.x >= 800) {
                ballz.sider = true;
                ballz.sidel = false;
            } else if (ballz.x <= 0) {
                ballz.sidel = true;
                ballz.sider = false;
            }
            if (ballz.x - pitcher.x <= 10 && ballz.y - pitcher.y <= 10) {
                hit = true;
                System.out.println("hit");
            }
            for (Bomb bombs : bomb) {

                if (Math.abs(bombs.y - ballz.y) <= 20 && Math.abs(bombs.x - ballz.x) <= 20) {
                    ballz.hit = true;
                    bombs.explode = true;
                    continue;
                }

            }
            // Use iterators to safely remove items while iterating

        }

        return hit;

    }

    public JFrame frame() {
        JFrame frame = new JFrame();
        frame.setVisible(true);
        frame.setSize(800, 800);

        return frame;
    }

    class Ball {
        public boolean sider = false;
        public boolean sidel = false;
        public boolean hit = false;
        int x = 500;
        int y = 700;
        int dx = 6;
        int dy = 5;
        int speed = 5;

        Random rand = new Random();
        int dang = rand.nextInt(10);
        boolean collided = false;

        public Ball(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public void move() {
            x += 2;
            y += (Math.round(Math.cos(x) * 20));

        }

        public void movel() {
            x -= 2;
            y += (Math.round(Math.cos(x) * 20));

        }

        public void slow() {
            dy -= 1;
        }

        public void draw(ImageIcon image3, Graphics g) {
            // Draw the image if it exists, otherwise draw a rectangle
            if (image3 != null && image3.getImage() != null) {
                g.drawImage(image3.getImage(), x, y, 70, 100, null);

            } else {
                g.setColor(Color.BLUE);
                g.fillRect(x, y, 50, 100);
            }
        }

    }

    class Bomb {
        boolean explode = false;
        int x;
        int y;

        public Bomb(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public void fall() {
            y += 5;
            x += 0;

        }

        public void explode() {
            System.out.println("exploded");

        }

        public void draw(ImageIcon image, Graphics g) {
            // Draw the image if itexists, otherwise draw a rectangle
            if (explode == false) {
                if (image != null && image.getImage() != null) {
                    g.drawImage(image.getImage(), x, y, 50, 100, null);

                } else {
                    g.setColor(Color.BLUE);
                    g.fillRect(x, y, 50, 100);
                }
            } else {
                g.setColor(Color.ORANGE);
                g.fillRect(x, y, 200, 200);
            }
        }
    }

    class Pitcher {
        int x, y;
        int dx, dy;
        boolean hit = false;

        public Pitcher(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public void handleKeyPress(KeyEvent e) {
            int keyCode = e.getKeyCode();
            switch (keyCode) {
                case KeyEvent.VK_B:
                    ball.add(new Ball(0, 600));
                    break;
                case KeyEvent.VK_N:
                    bomb.add(new Bomb(x, y));
                case KeyEvent.VK_LEFT:
                    x -= 20;
                    break;
                case KeyEvent.VK_RIGHT:
                    x += 20;
                    break;
                case KeyEvent.VK_SPACE:
                    pitcher.swoop();
                    break;

            }

            repaint();
        }

        public void keyReleased(KeyEvent e) {
            int keyCode = e.getKeyCode();
            switch (keyCode) {
                case KeyEvent.VK_SPACE:
                    pitcher.moveback();
                    break;
            }
            repaint();
        }

        public void draw(ImageIcon image1, Graphics g) {
            // Draw the image if it exists, otherwise draw a rectangle
            if (image1 != null && image1.getImage() != null) {
                g.drawImage(image1.getImage(), x, y, 50, 100, null);

            } else {
                g.setColor(Color.BLUE);
                g.fillRect(x, y, 50, 100);
            }
        }

        public void swoop() {
            y += 20;
        }

        public void moveback() {
            y -= 20;
        }

    }

    private ImageIcon image1;
    private ImageIcon image2;
    private ImageIcon image3;

    {
        // Try to load the image, handle error if not found
        try {
            image1 = new ImageIcon("croc.jpg");
            image2 = new ImageIcon("nuke.jpg");
            image3 = new ImageIcon("trala.jpg");
            if (image1.getIconWidth() == -1) {
                System.err.println("Image file 'bomb.png' not found.");
                image1 = null;
            }
        } catch (Exception ex) {
            System.err.println("Error loading image: " + ex.getMessage());
            image1 = null;
        }
    }
    // paintComponent

    @Override
    protected void paintComponent(Graphics g) {

        g.setColor(Color.BLUE);
        g.fillRect(0, 400, 800, 400);
        g.setColor(Color.YELLOW);
        g.fillOval(750, 50, 100, 60);
        g.drawLine(FRAMEBITS, ERROR, ALLBITS, ABORT);
        pitcher.draw(image1, g);
        for (Bomb bombs : bomb) {
            bombs.draw(image2, g);
        }
        for (Ball balls : ball) {
            balls.draw(image3, g);
        }

    }

    public static void main(String[] args) {

        JFrame frame = new JFrame();
        BaseRunner baseRunner = new BaseRunner();
        frame.add(baseRunner);
        frame.setSize(800, 800);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setVisible(true);

        baseRunner.setFocusable(true);
        baseRunner.requestFocusInWindow();

    }

    @Override
    public void keyTyped(KeyEvent e) {
        // Implement if needed
    }

    @Override
    public void keyPressed(KeyEvent e) {
        int keyCode = e.getKeyCode();
        switch (keyCode) {
            case KeyEvent.VK_SPACE:
                pitcher.swoop();
        }
        repaint();
    }

    @Override
    public void keyReleased(KeyEvent e) {
        int keyCode = e.getKeyCode();
        switch (keyCode) {
            case KeyEvent.VK_SPACE:
                pitcher.moveback();

        }
        repaint();
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        // Implement if needed
    }
}
