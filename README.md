# 2D Engine

A simple 2D engine written from scratch for educational purposes

You can see it running [here](https://barongello.github.io/2d-engine)

There are objects, movements, scalings and rotations that fail in every wrong matrices order. Feel free to explore

---

## Matrices order

Matrix multiplication is not commutative. So, in general:

$$
A \cdot B \neq B \cdot A
$$

Note: it is commutative only under specific conditions, such when A and B are square matrices of the same size and one is an inverse matrix, a scalar multiple of the identity matrix, or a diagonal matrix sharing the same structure

They are aplied from right to left. The steps are:

$$
A \cdot B \cdot C \cdot \vec{v} = \\
A \cdot B \cdot \vec{v_c} = \\
A \cdot \vec{v_{bc}} = \\
\vec{v_{abc}}
$$

First apply $C$ to $\vec{v}$, then apply $B$ to $\vec{v_c}$ and finally apply $A$ to $\vec{v_{bc}}$, resulting in $\vec{v_{abc}}$

You can pre-multiply the transformations, ending up with only one transformation matrix. Let's label the `transformation` matrix as $M_{abc}$

$$
(A \cdot B \cdot C) \cdot \vec{v} = M_{abc} \cdot \vec{v} = \vec{v_{abc}}
$$

We have 3 transformations: translation, rotation and scaling. Let's have a look on all 6 combinations and their effects

---

## Definitions

In 2D homogeneous coordinates, we define three matrices:

$$
T = \begin{bmatrix} 1 & 0 & t_x \\\\ 0 & 1 & t_y \\\\ 0 & 0 & 1 \end{bmatrix}
\qquad
R = \begin{bmatrix} \cos\theta & \sin\theta & 0 \\\\ -\sin\theta & \cos\theta & 0 \\\\ 0 & 0 & 1 \end{bmatrix}
\qquad
S = \begin{bmatrix} s_x & 0 & 0 \\\\ 0 & s_y & 0 \\\\ 0 & 0 & 1 \end{bmatrix}
$$

Note: the `-` sign in the `sin` of the $R$ matrix gives the direction of the rotation: `clockwise` or `counter-clockwise`. One of the `sin` should be positive and the other should be negative. The direction of the rotation also depends on the direction of your `y`axis

We compute a composite matrix $M$ by multiplying these three (in some order)

Every one of the 6 possible orderings of $T$, $R$, $S$ produces a mathematically different result, even though the same three transformations are being combined

---

## Failures

There are exactly two independent properties an order can get wrong:

### Position defect (orbiting)

If $T$ is not the last (leftmost) matrix applied, the translation offset gets caught up in a later rotation and/or scale. Instead of moving the object to $(t_x,\ t_y)$ and leaving it there, the object's final position swings around the world origin and/or gets stretched non-uniformly

### Shape defect (shearing)

If $R$ is applied before $S$, the scale factors $(s_x,\ s_y)$ no longer act along the object's own local axes: they act along the world x/y axes, which by then are misaligned with the object because it has already been rotated. This turns right angles into oblique angles (a rectangle becomes a rhombus/parallelogram), but only when scale is non-uniform ($s_x \neq s_y$)

The correct order must avoid both: $T$ must be last, and $S$ must come before $R$

---

## Test object

To make every order directly comparable, we use the same object and the same transform values throughout:

- Local shape: a unit square, corners at $(\pm1,\ \pm1)$
- Scale: $s_x = 2,\ s_y = 1$ (deliberately non-uniform, to expose shearing)
- Rotation: $\theta = 45\degree$, so $\cos\theta = \sin\theta = \dfrac{\sqrt{2}}{2}$
- Translation: $t_x = 100,\ t_y = 0$

For each order we check two things:

1. Where does the object's center end up? ( should be $(100,\ 0)$ )
2. Is the shape still a proper rectangle? (checked via the dot product between two adjacent edges at corner $(1,\ 1)$ - a right angle gives a dot product of $0$)

### TRS - correct order

Matrix product: $M = T \cdot R \cdot S$

Apply order (to the point): $S \to R \to T$

$$
\vec{v}_{trs} = T \cdot (R \cdot (S \cdot \vec{v}))
$$

Center check, transforming the local center $(0,\ 0)$:

$$
S \cdot (0, 0) = (0, 0) \quad\to\quad R \cdot (0, 0) = (0, 0) \quad\to\quad T \cdot (0, 0) = (100, 0)
$$

The center lands exactly at $(100,\ 0)$. Correct

Full corner computation:

| Local corner | After $S$ | After $R$ | After $T$ (final) |
|---|---|---|---|
| $(1,\ 1)$ | $(2,\ 1)$ | $\left(\frac{\sqrt2}{2},\ \frac{3\sqrt2}{2}\right)$ | $\left(100 + \frac{\sqrt2}{2},\ \frac{3\sqrt2}{2}\right) \approx (100.71,\ 2.12)$ |
| $(1,\ -1)$ | $(2,\ -1)$ | $\left(\frac{3\sqrt2}{2},\ \frac{\sqrt2}{2}\right)$ | $\left(100 + \frac{3\sqrt2}{2},\ \frac{\sqrt2}{2}\right) \approx (102.12,\ 0.71)$ |
| $(-1,\ -1)$ | $(-2,\ -1)$ | $\left(-\frac{\sqrt2}{2},\ -\frac{3\sqrt2}{2}\right)$ | $\approx (99.29,\ -2.12)$ |
| $(-1,\ 1)$ | $(-2,\ 1)$ | $\left(-\frac{3\sqrt2}{2},\ -\frac{\sqrt2}{2}\right)$ | $\approx (97.88,\ -0.71)$ |

Shape check at corner $(1,\ 1)$, comparing the edge toward $(1,\ -1)$ and the edge toward $(-1,\ 1)$:

$$
\vec{e_a} = (1.41,\ -1.41) \qquad \vec{e_b} = (-2.83,\ -2.83)
$$
$$
\vec{e_a} \cdot \vec{e_b} = (1.41)(-2.83) + (-1.41)(-2.83) = -4.0 + 4.0 = 0
$$

Dot product is exactly $0$, $90\degree$ angle preserved. The result is a proper $4 \times 2$ rectangle, rotated $45\degree$, centered at $(100,\ 0)$. Both position and shape are correct

---

### TSR - wrong order (shape defect only)

Matrix product: $M = T \cdot S \cdot R$

Apply order: $R \to S \to T$ (rotation happens before scale)

Center check:

$$
R \cdot (0,\ 0) = (0,\ 0) \quad\to\quad S \cdot (0,\ 0) = (0,\ 0) \quad\to\quad T \cdot (0,\ 0) = (100,\ 0)
$$

Center is still $(100,\ 0)$, since $T$ is applied last here, position is fine

Corner $(1,\ 1)$ walkthrough:

$$
R \cdot (1,\ 1) = (0,\ \sqrt2) \quad\to\quad S \cdot (0,\ \sqrt2) = (0,\ \sqrt2) \quad\to\quad T \cdot (0,\ \sqrt2) = (100,\ \sqrt2) \approx (100,\ 1.41)
$$

Shape check at corner $(1,\ 1)$:

$$
\vec{e_a} = (2\sqrt2, -\sqrt2) \qquad \vec{e_b} = (-2\sqrt2,\ -\sqrt2)
$$
$$
\vec{e_a} \cdot \vec{e_b} = (2\sqrt2)(-2\sqrt2) + (-\sqrt2)(-\sqrt2) = -8 + 2 = -6
$$

Since $|\vec{e_a}| = |\vec{e_b}| = \sqrt{10}$:

$$
\cos(\text{angle}) = \frac{-6}{10} = -0.6 \quad\Rightarrow\quad \text{angle} \approx 126.87\degree
$$

Result: the position is exactly right ( the object is centered at $(100,\ 0)$ ) but the shape is no longer a rectangle. It's a rhombus with $\approx 126.87\degree$ and $\approx 53.13\degree$ corners instead of four right angles. Scaling $x$ by $2$ after the object was already rotated $45\degree$ stretched it diagonally instead of along its own width

---

### RTS - wrong order (position defect only)

Matrix product: $M = R \cdot T \cdot S$

Apply order: $S \to T \to R$ (translation happens before the final rotation)

Center check:

$$
S \cdot (0, 0) = (0, 0) \quad\to\quad T \cdot (0, 0) = (100, 0) \quad\to\quad R \cdot (100, 0) = \left(50\sqrt2,\ 50\sqrt2\right) \approx (70.71,\ 70.71)
$$

The center should be at $(100,\ 0)$ but instead lands at $\approx(70.71,\ 70.71)$. Because the final $R$ rotates the entire already-translated point around the world origin, the whole object swings along an arc (exactly as if $(100,\ 0)$ were the tip of a 100-unit pendulum arm and $R$ swung that arm by $45\degree$)

Shape check at corner $(1,\ 1)$, full corners come out to $\left(\frac{101\sqrt2}{2},\ \frac{103\sqrt2}{2}\right)$, $\left(\frac{103\sqrt2}{2},\ \frac{101\sqrt2}{2}\right)$, $\left(\frac{97\sqrt2}{2},\ \frac{99\sqrt2}{2}\right)$ for corners $(1,\ 1)$, $(1,\ -1)$, $(-1,\ 1)$ respectively:

$$
\vec{e_a} = (\sqrt2,\ -\sqrt2) \qquad \vec{e_b} = (-2\sqrt2,\ -2\sqrt2)
$$
$$
\vec{e_a} \cdot \vec{e_b} = (\sqrt2)(-2\sqrt2) + (-\sqrt2)(-2\sqrt2) = -4 + 4 = 0
$$

Result: the rectangle's shape is perfectly preserved (still $90\degree$ corners). Since $S$ is applied before $R$ in this order, no shearing occurs. But the object is in the wrong place entirely: instead of sitting at $(100,\ 0)$, it ends up at $(70.71,\ 70.71)$, as if it had orbited around the origin

---

### RST - wrong order (position defect, more severe)

Matrix product: $M = R \cdot S \cdot T$

Apply order: $T \to S \to R$ (translation happens first, then gets caught up in the scale too)

Center check:

$$
T \cdot (0,\ 0) = (100,\ 0) \quad\to\quad S \cdot (100,\ 0) = (200,\ 0) \quad\to\quad R \cdot (200,\ 0) = \left(100\sqrt2,\ 100\sqrt2\right) \approx (141.42,\ 141.42)
$$

This is worse than the previous case: because translation happens before scale, the offset itself ($t_x = 100$) gets multiplied by $s_x = 2$, doubling it to $200$, before the final rotation swings it around the origin. The center ends up at $(141.42,\ 141.42)$ instead of $(100,\ 0)$

Shape check, corners work out to $\left(\frac{201\sqrt2}{2},\ \frac{203\sqrt2}{2}\right)$, $\left(\frac{203\sqrt2}{2},\ \frac{201\sqrt2}{2}\right)$, $\left(\frac{197\sqrt2}{2},\ \frac{199\sqrt2}{2}\right)$:

$$
\vec{e_a} = (\sqrt2, -\sqrt2) \qquad \vec{e_b} = (-2\sqrt2, -2\sqrt2) \qquad \vec{e_a} \cdot \vec{e_b} = -4 + 4 = 0
$$

Result: shape is preserved (still a proper rectangle, $S$ still comes before $R$ in this order), but the positional error is even more dramatic than RTS, because the scale amplified the translation offset before the rotation swung it around the origin

---

### STR - wrong order (both defects)

Matrix product: $M = S \cdot T \cdot R$

Apply order: $R \to T \to S$ (rotation first [shears later], and translation is caught by the final scale)

Center check:

$$
R \cdot (0, 0) = (0, 0) \quad\to\quad T \cdot (0, 0) = (100, 0) \quad\to\quad S \cdot (100, 0) = (200, 0)
$$

Center lands at $(200,\ 0)$ instead of $(100,\ 0)$. Since $S$ is the last operation and $s_x = 2$, the translation offset is doubled

Shape check at corner $(1,\ 1)$, corners come out to $(200,\ \sqrt2)$, $(200 + 2\sqrt2,\ 0)$, $(200 - 2\sqrt2,\ 0)$:

$$
\vec{e_a} = (2\sqrt2, -\sqrt2) \qquad \vec{e_b} = (-2\sqrt2, -\sqrt2) \qquad \vec{e_a} \cdot \vec{e_b} = -8 + 2 = -6
$$

Same $-6$ as the TSR case $\to$ same $\approx 126.87\degree$ corner angle

Result: the worst of both worlds, the object is both in the wrong place ( $(200,\ 0)$ instead of $(100,\ 0)$ ) and sheared into a rhombus, because $R$ is applied before $S$ here too

---

### SRT - wrong order (both defects)

Matrix product: $M = S \cdot R \cdot T$

Apply order: $T \to R \to S$ (translation first, then rotation, then scale)

Center check:

$$
T \cdot (0,\ 0) = (100,\ 0) \quad\to\quad R \cdot (100,\ 0) = \left(50\sqrt2,\ 50\sqrt2\right) \quad\to\quad S \cdot \left(50\sqrt2,\ 50\sqrt2\right) = \left(100\sqrt2,\ 50\sqrt2\right) \approx (141.42,\ 70.71)
$$

Center lands at $(141.42,\ 70.71)$ instead of $(100,\ 0)$

Shape check at corner $(1,\ 1)$, corners come out to $(100\sqrt2,\ 51\sqrt2)$, $(102\sqrt2,\ 50\sqrt2)$, $(98\sqrt2,\ 50\sqrt2)$:

$$
\vec{e_a} = (2\sqrt2,\ -\sqrt2) \qquad \vec{e_b} = (-2\sqrt2,\ -\sqrt2) \qquad \vec{e_a} \cdot \vec{e_b} = -8 + 2 = -6
$$

Sheared into the same $\approx 126.87\degree$ rhombus

Result: wrong position and sheared shape, the same double failure as STR, just displaced to a different (equally wrong) location

---

### Summary table

| Order | Matrix product | Apply order | Center ends up at | Position correct? | Shape correct? |
|---|---|---|---|:---:|:---:|
| TRS | $T{\cdot}R{\cdot}S$ | $S \to R \to T$ | $(100,\ 0)$ | Yes | Yes |
| TSR | $T{\cdot}S{\cdot}R$ | $R \to S \to T$ | $(100,\ 0)$ | Yes | No (rhombus, $126.87\degree$) |
| RTS | $R{\cdot}T{\cdot}S$ | $S \to T \to R$ | $(70.71,\ 70.71)$ | No (orbits) | Yes |
| RST | $R{\cdot}S{\cdot}T$ | $T \to S \to R$ | $(141.42,\ 141.42)$ | No (orbits, amplified) | Yes |
| STR | $S{\cdot}T{\cdot}R$ | $R \to T \to S$ | $(200,\ 0)$ | No (offset scaled) | No (rhombus, $126.87\degree$) |
| SRT | $S{\cdot}R{\cdot}T$ | $T \to R \to S$ | $(141.42,\ 70.71)$ | No (offset scaled & rotated) | No (rhombus, $126.87\degree$) |

### The general rule

Both failure modes reduce to simple, independent conditions on the apply order (right-to-left reading of the matrix product):

- Shape defect (shearing): happens if and only if $R$ is applied before $S$. This is purely a property of the relative order of $R$ and $S$ (it doesn't matter where $T$ sits). Every order above where $R$ comes before $S$ in the apply sequence (TSR, STR, SRT) produces the same $126.87\degree$ shear. Every order where $S$ comes before $R$ (TRS, RTS, RST) preserves the right angle

- Position defect (orbiting): happens if and only if $T$ is not the last operation applied. Any rotation or scale that happens after the translation acts on the already-translated coordinate, pivoting the object's position around the world origin instead of leaving it in place. This is why TRS and TSR (the only two orders with $T$ applied last) are the only ones with a correct center

Only TRS satisfies both conditions simultaneously ($S$ before $R$, and $T$ last), which is exactly why it's the standard convention in essentially every 2D/3D graphics engine
